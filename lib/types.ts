export type UserRole = 'estudiante' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  login_attempts: number;
  locked_until: string | null;
  created_at: string;
}

export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  is_active: boolean;
  login_attempts: number;
  locked_until: string | null;
  created_at: string;
}

export interface SystemConfig {
  id: number;
  institution_name: string;
  allowed_domain: string;
  min_evaluations_to_publish: number;
  updated_at: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  user_id?: string;
  user_email?: string;
  user_role?: 'admin';
  action:
    | 'login' | 'logout'
    | 'create_professor' | 'update_professor' | 'deactivate_professor'
    | 'create_period' | 'update_period' | 'close_period'
    | 'delete_comment' | 'update_system_config'
    | 'create_admin_user' | 'toggle_user'
    | 'bootstrap';
  entity: 'professor' | 'period' | 'comment' | 'user' | 'system';
  entity_id?: string;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password_hash: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  name?: string;
  is_active?: boolean;
  login_attempts?: number;
  locked_until?: string | null;
  password_hash?: string;
}

export interface UserFilters {
  role?: UserRole;
  is_active?: boolean;
}

export interface UpdateSystemConfigRequest {
  institution_name?: string;
  allowed_domain?: string;
  min_evaluations_to_publish?: number;
}

export interface JWTPayload {
  userId: string;
  role: UserRole;
  email: string;
}

// Professor types
export interface Professor {
  id: string;
  name: string;
  subject: string;
  department: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateProfessorRequest {
  name: string;
  subject: string;
  department?: string;
}

export interface UpdateProfessorRequest {
  name?: string;
  subject?: string;
  department?: string;
  is_active?: boolean;
}

export interface ProfessorFilters {
  is_active?: boolean;
}

// Period types
export interface Period {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'programado' | 'activo' | 'cerrado';
  is_manually_closed: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreatePeriodRequest {
  name: string;
  start_date: string;
  end_date: string;
}

export interface UpdatePeriodRequest {
  name?: string;
  start_date?: string;
  end_date?: string;
  status?: 'programado' | 'activo' | 'cerrado';
}

// Evaluation types
export interface EvaluationScores {
  clarity: number;
  methodology: number;
  punctuality: number;
  treatment: number;
  knowledge: number;
}

export interface SubmitEvaluationRequest {
  professorId: string;
  periodId: string;
  scores: EvaluationScores;
  comment?: string;
}

export interface StudentProgress {
  professor: Professor;
  evaluated: boolean;
}

export interface PublicRankingItem {
  professor_id: string;
  professor_name: string;
  department: string | null;
  subject: string;
  total_evaluations: number;
  avg_clarity: number;
  avg_methodology: number;
  avg_punctuality: number;
  avg_treatment: number;
  avg_knowledge: number;
  avg_overall: number;
}

export interface PublicProfessorProfile {
  professor: Professor;
  stats: {
    total_evaluations: number;
    avg_clarity: number;
    avg_methodology: number;
    avg_punctuality: number;
    avg_treatment: number;
    avg_knowledge: number;
    avg_overall: number;
  } | null;
  comments: string[];
}

export interface ReportFilters {
  professor_id?: string;
  period_id?: string;
  subject?: string;
}

export interface AdminReportData {
  evaluations: {
    id: string;
    professor_id: string;
    professor_name: string;
    period_id: string;
    period_name: string;
    score_clarity: number;
    score_methodology: number;
    score_punctuality: number;
    score_treatment: number;
    score_knowledge: number;
    avg_general: number;
    created_at: string;
  }[];
  summary: {
    total: number;
    avg_overall: number;
  };
}

export interface CommentItem {
  id: string;
  professor_id: string;
  professor_name: string;
  period_id: string;
  comment: string;
  comment_is_visible: boolean;
  created_at: string;
}
