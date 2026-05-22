import { supabaseAdmin } from './supabase';
import { getSeedData } from './seedReader';
import { appendAuditEntry, readAuditMonth } from './blobAudit';
import { computeEvaluationToken, verifyNotDuplicate } from './anonymizationService';
import { buildRanking } from './evaluationService';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { sendVerificationEmail, sendPasswordResetEmail } from './emailService';
import type {
  User, SafeUser, SystemConfig, AuditEntry, CreateUserRequest,
  UpdateUserRequest, UserFilters, UpdateSystemConfigRequest,
  Professor, CreateProfessorRequest, UpdateProfessorRequest, ProfessorFilters,
  Period, CreatePeriodRequest, UpdatePeriodRequest,
  SubmitEvaluationRequest, StudentProgress, PublicRankingItem,
  PublicProfessorProfile, ReportFilters, AdminReportData, CommentItem
} from './types';

// Suppress unused import warnings
void bcrypt;

// Custom errors
export class NotFoundError extends Error { constructor(msg: string) { super(msg); this.name = 'NotFoundError'; } }
export class ConflictError extends Error { constructor(msg: string) { super(msg); this.name = 'ConflictError'; } }
export class ForbiddenError extends Error { constructor(msg: string) { super(msg); this.name = 'ForbiddenError'; } }
export class ValidationError extends Error { constructor(msg: string) { super(msg); this.name = 'ValidationError'; } }

// System mode detection
export async function getSystemMode(): Promise<'seed' | 'live'> {
  try {
    const { error } = await supabaseAdmin.from('users').select('id').limit(1);
    if (error) return 'seed';
    return 'live';
  } catch {
    return 'seed';
  }
}

// System config
export async function getSystemConfig(): Promise<SystemConfig> {
  const mode = await getSystemMode();
  if (mode === 'seed') {
    const seed = getSeedData();
    return { id: 1, ...seed.system_config, updated_at: new Date().toISOString() };
  }
  const { data, error } = await supabaseAdmin.from('system_config').select('*').limit(1).single();
  if (error || !data) {
    const seed = getSeedData();
    return { id: 1, ...seed.system_config, updated_at: new Date().toISOString() };
  }
  return data as SystemConfig;
}

export async function updateSystemConfig(updateData: UpdateSystemConfigRequest, adminId: string): Promise<SystemConfig> {
  const { data, error } = await supabaseAdmin
    .from('system_config')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', 1)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: adminId,
    action: 'update_system_config',
    entity: 'system',
    summary: 'Configuración del sistema actualizada',
    metadata: updateData as Record<string, unknown>,
  });
  return data as SystemConfig;
}

// Users
export async function getUserByEmail(email: string): Promise<User | null> {
  const mode = await getSystemMode();
  if (mode === 'seed') {
    const seed = getSeedData();
    const user = seed.users.find(u => u.email === email);
    if (!user) return null;
    return { id: 'seed-admin', ...user, role: user.role as User['role'], login_attempts: 0, locked_until: null, created_at: new Date().toISOString() } as User;
  }
  const { data } = await supabaseAdmin.from('users').select('*').eq('email', email).single();
  return (data as User) ?? null;
}

export async function getUserById(id: string): Promise<User | null> {
  const mode = await getSystemMode();
  if (mode === 'seed') {
    const seed = getSeedData();
    if (id === 'seed-admin') {
      const user = seed.users[0];
      return { id: 'seed-admin', ...user, role: user.role as User['role'], login_attempts: 0, locked_until: null, created_at: new Date().toISOString() } as User;
    }
    return null;
  }
  const { data } = await supabaseAdmin.from('users').select('*').eq('id', id).single();
  return (data as User) ?? null;
}

export async function createUser(data: CreateUserRequest): Promise<User> {
  const config = await getSystemConfig();
  const domain = data.email.split('@')[1];
  if (domain !== config.allowed_domain) {
    throw new ValidationError(`Solo se aceptan correos del dominio ${config.allowed_domain}`);
  }
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .insert({ ...data, is_active: false, login_attempts: 0 })
    .select()
    .single();
  if (error) {
    if (error.code === '23505') throw new ConflictError('Ya existe una cuenta con este correo');
    throw new Error(error.message);
  }

  // Create activation token
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  await supabaseAdmin.from('activation_tokens').insert({
    user_id: (user as User).id,
    token,
    expires_at: expiresAt,
  });

  // Send verification email
  try {
    await sendVerificationEmail(data.email, token, config.institution_name);
  } catch (emailErr) {
    console.error('Error sending verification email:', emailErr);
  }

  return user as User;
}

export async function activateUser(token: string): Promise<User> {
  const { data: tokenData } = await supabaseAdmin
    .from('activation_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (!tokenData) throw new NotFoundError('Token inválido');
  if (tokenData.used_at) throw new ValidationError('Este enlace ya fue utilizado');
  if (new Date(tokenData.expires_at) < new Date()) throw new ValidationError('El enlace ha expirado');

  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update({ is_active: true })
    .eq('id', tokenData.user_id)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from('activation_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenData.id);

  return user as User;
}

export async function createPasswordResetToken(email: string): Promise<string> {
  const user = await getUserByEmail(email);
  if (!user) throw new NotFoundError('No existe una cuenta con este correo');

  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  await supabaseAdmin.from('password_reset_tokens').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  });

  const config = await getSystemConfig();
  try {
    await sendPasswordResetEmail(email, token, config.institution_name);
  } catch (emailErr) {
    console.error('Error sending password reset email:', emailErr);
  }

  return token;
}

export async function resetPassword(token: string, newPasswordHash: string): Promise<void> {
  const { data: tokenData } = await supabaseAdmin
    .from('password_reset_tokens')
    .select('*')
    .eq('token', token)
    .single();

  if (!tokenData) throw new NotFoundError('Token inválido');
  if (tokenData.used_at) throw new ValidationError('Este enlace ya fue utilizado');
  if (new Date(tokenData.expires_at) < new Date()) throw new ValidationError('El enlace ha expirado');

  await supabaseAdmin
    .from('users')
    .update({ password_hash: newPasswordHash, login_attempts: 0, locked_until: null })
    .eq('id', tokenData.user_id);

  await supabaseAdmin
    .from('password_reset_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', tokenData.id);
}

export async function updateUser(id: string, data: UpdateUserRequest): Promise<User> {
  const { data: user, error } = await supabaseAdmin
    .from('users')
    .update(data)
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  return user as User;
}

export async function listUsers(filters?: UserFilters): Promise<SafeUser[]> {
  let query = supabaseAdmin
    .from('users')
    .select('id, name, email, role, is_active, login_attempts, locked_until, created_at');
  if (filters?.role) query = query.eq('role', filters.role);
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  const { data } = await query.order('created_at', { ascending: false });
  return (data || []) as SafeUser[];
}

export async function incrementLoginAttempts(userId: string): Promise<void> {
  const user = await getUserById(userId);
  if (!user) return;
  const attempts = user.login_attempts + 1;
  const update: UpdateUserRequest = { login_attempts: attempts };
  if (attempts >= 5) {
    update.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  }
  await supabaseAdmin.from('users').update(update).eq('id', userId);
}

export async function resetLoginAttempts(userId: string): Promise<void> {
  await supabaseAdmin.from('users').update({ login_attempts: 0, locked_until: null }).eq('id', userId);
}

// Professors
export async function getProfessors(filters?: ProfessorFilters): Promise<Professor[]> {
  let query = supabaseAdmin.from('professors').select('*');
  if (filters?.is_active !== undefined) query = query.eq('is_active', filters.is_active);
  const { data } = await query.order('name');
  return (data || []) as Professor[];
}

export async function getProfessorById(id: string): Promise<Professor | null> {
  const { data } = await supabaseAdmin.from('professors').select('*').eq('id', id).single();
  return (data as Professor) ?? null;
}

export async function createProfessor(userId: string, data: CreateProfessorRequest): Promise<Professor> {
  const { data: prof, error } = await supabaseAdmin
    .from('professors')
    .insert({ ...data, is_active: true })
    .select()
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: userId,
    action: 'create_professor',
    entity: 'professor',
    entity_id: (prof as Professor).id,
    summary: `Profesor creado: ${data.name}`,
  });
  return prof as Professor;
}

export async function updateProfessor(id: string, userId: string, data: UpdateProfessorRequest): Promise<Professor> {
  const { data: prof, error } = await supabaseAdmin
    .from('professors')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: userId,
    action: 'update_professor',
    entity: 'professor',
    entity_id: id,
    summary: `Profesor actualizado: ${id}`,
  });
  return prof as Professor;
}

export async function deactivateProfessor(id: string, userId: string): Promise<Professor> {
  const { count } = await supabaseAdmin
    .from('evaluations')
    .select('*', { count: 'exact', head: true })
    .eq('professor_id', id);

  const hasEvaluations = (count ?? 0) > 0;

  if (hasEvaluations) {
    const { data: prof, error } = await supabaseAdmin
      .from('professors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    await recordAudit({
      id: randomBytes(16).toString('hex'),
      timestamp: new Date().toISOString(),
      user_id: userId,
      action: 'deactivate_professor',
      entity: 'professor',
      entity_id: id,
      summary: `Profesor desactivado (tiene evaluaciones): ${id}`,
    });
    return prof as Professor;
  } else {
    const { data: prof, error } = await supabaseAdmin
      .from('professors')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return prof as Professor;
  }
}

// Periods
export async function getActivePeriod(): Promise<Period | null> {
  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabaseAdmin
    .from('periods')
    .select('*')
    .lte('start_date', today)
    .gte('end_date', today)
    .or('is_manually_closed.is.null,is_manually_closed.eq.false')
    .order('start_date', { ascending: false })
    .limit(1);
  return (data && data.length > 0) ? data[0] as Period : null;
}

export async function getPeriods(): Promise<Period[]> {
  const { data } = await supabaseAdmin.from('periods').select('*').order('start_date', { ascending: false });
  return (data || []) as Period[];
}

export async function createPeriod(userId: string, data: CreatePeriodRequest): Promise<Period> {
  const { count } = await supabaseAdmin
    .from('periods')
    .select('*', { count: 'exact', head: true })
    .lte('start_date', data.end_date)
    .gte('end_date', data.start_date)
    .or('is_manually_closed.is.null,is_manually_closed.eq.false');

  if ((count ?? 0) > 0) {
    throw new ConflictError('Ya existe un período con fechas solapadas. Verifica las fechas del período anterior.');
  }

  const { data: period, error } = await supabaseAdmin
    .from('periods')
    .insert({ ...data, status: 'programado', is_manually_closed: false })
    .select()
    .single();
  if (error) throw new Error(error.message);

  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: userId,
    action: 'create_period',
    entity: 'period',
    entity_id: (period as Period).id,
    summary: `Período creado: ${data.name}`,
  });
  return period as Period;
}

export async function updatePeriod(id: string, userId: string, data: UpdatePeriodRequest): Promise<Period> {
  const { data: period, error } = await supabaseAdmin
    .from('periods')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: userId,
    action: 'update_period',
    entity: 'period',
    entity_id: id,
    summary: `Período actualizado: ${id}`,
  });
  return period as Period;
}

export async function closePeriod(id: string, userId: string): Promise<Period> {
  const { data: period, error } = await supabaseAdmin
    .from('periods')
    .update({ status: 'cerrado', is_manually_closed: true, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw new Error(error.message);
  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: userId,
    action: 'close_period',
    entity: 'period',
    entity_id: id,
    summary: `Período cerrado manualmente: ${id}`,
  });
  return period as Period;
}

// Evaluations
export async function submitEvaluation(studentId: string, data: SubmitEvaluationRequest): Promise<void> {
  const { professorId, periodId, scores, comment } = data;

  const period = await getActivePeriod();
  if (!period || period.id !== periodId) throw new ForbiddenError('Período no activo');

  const professor = await getProfessorById(professorId);
  if (!professor || !professor.is_active) throw new NotFoundError('Profesor no encontrado');

  const canEvaluate = await verifyNotDuplicate(studentId, professorId, periodId);
  if (!canEvaluate) throw new ConflictError('Ya evaluaste a este profesor en este período');

  const avgGeneral = (scores.clarity + scores.methodology + scores.punctuality + scores.treatment + scores.knowledge) / 5;

  const { error: evalError } = await supabaseAdmin.from('evaluations').insert({
    professor_id: professorId,
    period_id: periodId,
    score_clarity: scores.clarity,
    score_methodology: scores.methodology,
    score_punctuality: scores.punctuality,
    score_treatment: scores.treatment,
    score_knowledge: scores.knowledge,
    avg_general: avgGeneral,
    comment: comment ?? null,
    comment_is_visible: true,
  });
  if (evalError) throw new Error(evalError.message);

  const token = computeEvaluationToken(studentId, professorId, periodId);
  const { error: tokenError } = await supabaseAdmin.from('evaluation_tokens').insert({
    token_hash: token,
    professor_id: professorId,
    period_id: periodId,
  });
  if (tokenError) throw new Error(tokenError.message);
}

export async function getStudentProgress(studentId: string, periodId: string): Promise<StudentProgress[]> {
  const professors = await getProfessors({ is_active: true });
  const results = await Promise.all(
    professors.map(async (prof) => ({
      professor: prof,
      evaluated: !(await verifyNotDuplicate(studentId, prof.id, periodId)),
    }))
  );
  return results;
}

export async function hasStudentEvaluated(studentId: string, professorId: string, periodId: string): Promise<boolean> {
  return !(await verifyNotDuplicate(studentId, professorId, periodId));
}

// Public results
export async function getPublicRanking(periodId: string): Promise<PublicRankingItem[]> {
  const config = await getSystemConfig();
  return buildRanking(periodId, config.min_evaluations_to_publish);
}

export async function getPublicProfessorProfile(professorId: string, periodId: string): Promise<PublicProfessorProfile | null> {
  const professor = await getProfessorById(professorId);
  if (!professor) return null;

  const config = await getSystemConfig();
  const { data: stats } = await supabaseAdmin
    .from('professor_period_stats')
    .select('*')
    .eq('professor_id', professorId)
    .eq('period_id', periodId)
    .single();

  const hasEnough = stats && stats.total_evaluations >= config.min_evaluations_to_publish;

  let comments: string[] = [];
  if (hasEnough) {
    const { data: evalData } = await supabaseAdmin
      .from('evaluations')
      .select('comment')
      .eq('professor_id', professorId)
      .eq('period_id', periodId)
      .eq('comment_is_visible', true)
      .not('comment', 'is', null);
    comments = (evalData || []).map((e: { comment: string }) => e.comment).filter(Boolean);
  }

  return {
    professor,
    stats: hasEnough ? {
      total_evaluations: stats.total_evaluations,
      avg_clarity: stats.avg_clarity,
      avg_methodology: stats.avg_methodology,
      avg_punctuality: stats.avg_punctuality,
      avg_treatment: stats.avg_treatment,
      avg_knowledge: stats.avg_knowledge,
      avg_overall: stats.avg_overall,
    } : null,
    comments,
  };
}

// Admin reports
export async function getAdminReport(filters: ReportFilters): Promise<AdminReportData> {
  let query = supabaseAdmin
    .from('evaluations')
    .select(`
      id, professor_id, period_id,
      score_clarity, score_methodology, score_punctuality, score_treatment, score_knowledge,
      avg_general, created_at,
      professors!inner(name, subject),
      periods!inner(name)
    `);

  if (filters.professor_id) query = query.eq('professor_id', filters.professor_id);
  if (filters.period_id) query = query.eq('period_id', filters.period_id);

  const { data } = await query.order('created_at', { ascending: false });

  const evaluations = (data || []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    professor_id: e.professor_id as string,
    professor_name: (e.professors as { name: string })?.name || '',
    period_id: e.period_id as string,
    period_name: (e.periods as { name: string })?.name || '',
    score_clarity: e.score_clarity as number,
    score_methodology: e.score_methodology as number,
    score_punctuality: e.score_punctuality as number,
    score_treatment: e.score_treatment as number,
    score_knowledge: e.score_knowledge as number,
    avg_general: e.avg_general as number,
    created_at: (e.created_at as string).split('T')[0],
  }));

  const total = evaluations.length;
  const avg_overall = total > 0 ? evaluations.reduce((sum, e) => sum + e.avg_general, 0) / total : 0;

  return { evaluations, summary: { total, avg_overall: Math.round(avg_overall * 100) / 100 } };
}

export async function getComments(periodId: string, professorId?: string): Promise<CommentItem[]> {
  let query = supabaseAdmin
    .from('evaluations')
    .select(`
      id, professor_id, period_id, comment, comment_is_visible, created_at,
      professors!inner(name)
    `)
    .eq('period_id', periodId)
    .not('comment', 'is', null);

  if (professorId) query = query.eq('professor_id', professorId);

  const { data } = await query.order('created_at', { ascending: false });

  return (data || []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    professor_id: e.professor_id as string,
    professor_name: (e.professors as { name: string })?.name || '',
    period_id: e.period_id as string,
    comment: e.comment as string,
    comment_is_visible: e.comment_is_visible as boolean,
    created_at: e.created_at as string,
  }));
}

export async function deleteComment(commentId: string, adminId: string): Promise<void> {
  await supabaseAdmin
    .from('evaluations')
    .update({ comment_is_visible: false })
    .eq('id', commentId);

  await recordAudit({
    id: randomBytes(16).toString('hex'),
    timestamp: new Date().toISOString(),
    user_id: adminId,
    action: 'delete_comment',
    entity: 'comment',
    entity_id: commentId,
    summary: `Comentario moderado: ${commentId}`,
  });
}

// Audit
export async function recordAudit(entry: AuditEntry): Promise<void> {
  try {
    await appendAuditEntry(entry);
  } catch (err) {
    console.error('Audit error:', err);
  }
}

export async function readAuditMonthData(yyyymm: string): Promise<AuditEntry[]> {
  return readAuditMonth(yyyymm);
}
