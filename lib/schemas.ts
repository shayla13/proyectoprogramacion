import { z } from 'zod';

export const LoginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida'),
});

export const RegisterSchema = z.object({
  name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().email('Email inválido'),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

export const CreateProfessorSchema = z.object({
  name: z.string().min(1).max(150),
  subject: z.string().min(1).max(150),
  department: z.string().max(150).optional(),
});

export const UpdateProfessorSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  subject: z.string().min(1).max(150).optional(),
  department: z.string().max(150).optional(),
  is_active: z.boolean().optional(),
});

export const CreatePeriodSchema = z.object({
  name: z.string().min(1).max(150),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Formato de fecha inválido (YYYY-MM-DD)'),
}).refine(data => data.start_date < data.end_date, {
  message: 'La fecha de inicio debe ser anterior a la fecha de cierre',
  path: ['end_date'],
});

export const UpdatePeriodSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(['programado', 'activo', 'cerrado']).optional(),
});

export const EvaluationScoresSchema = z.object({
  clarity: z.number().int().min(1).max(5),
  methodology: z.number().int().min(1).max(5),
  punctuality: z.number().int().min(1).max(5),
  treatment: z.number().int().min(1).max(5),
  knowledge: z.number().int().min(1).max(5),
});

export const SubmitEvaluationSchema = z.object({
  professorId: z.string().uuid(),
  periodId: z.string().uuid(),
  scores: EvaluationScoresSchema,
  comment: z.string().max(1000).optional(),
});

export const SystemConfigSchema = z.object({
  institution_name: z.string().min(1).max(150).optional(),
  allowed_domain: z.string().min(1).max(100).optional(),
  min_evaluations_to_publish: z.number().int().min(1).optional(),
});
