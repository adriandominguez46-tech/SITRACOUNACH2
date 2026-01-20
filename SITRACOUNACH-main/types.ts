
export enum UserRole {
  AFILIADO = 'Afiliado',
  DELEGADO = 'Delegado',
  SECRETARIO = 'Secretario General',
  TESORERO = 'Tesorero',
  VOCAL = 'Vocal',
  ADMIN = 'Administrador',
  EDITOR = 'Editor'
}

export enum EmploymentStatus {
  ACTIVO = 'Activo',
  LICENCIA = 'Licencia',
  SUSPENDIDO = 'Suspido',
  JUBILADO = 'Jubilado'
}

export enum GroupType {
  PERMANENTE = 'Permanente',
  TEMPORAL = 'Temporal'
}

export interface UserPermissions {
  perm_all?: boolean;
  perm_status?: boolean;
  perm_role?: boolean;
  perm_photo?: boolean;
  perm_treasury_view?: boolean;
  perm_treasury_pay?: boolean;
}

export interface UserGroup {
  id: string;
  name: string;
  description: string;
  type: GroupType;
  memberIds: string[]; 
  createdAt: string;
}

export interface UserProfile extends UserPermissions {
  id: string;
  fullName: string;
  employeeId: string;
  email: string;
  email_unach?: string;
  nickname?: string;
  password_hash?: string;
  direccion?: string;
  status: EmploymentStatus;
  role: UserRole;
  area: string; 
  joinDate: string;
  rfc?: string;
  curp?: string;
  puesto?: string;
  dependencia?: string;
  phone?: string;
  isAdmin?: boolean;
  nivel?: string;
  fotoUrl?: string;
  firmaUrl?: string;
  qrUrl?: string;
  last_login?: string;
  last_active?: string;
  grupos?: string;
}

export interface KnowledgeBaseItem {
  id: string;
  titulo: string;
  contenido: string;
  referencia: string; // Número de oficio o sección de ley
  categoria: 'Estatutos' | 'CCT' | 'Oficio' | 'Jurisprudencia' | 'General';
  fechaDocumento: string;
  activo: boolean;
}

export interface LaborEvent {
  id: string;
  nombre: string;
  fecha: string;
  fechaCierre: string;
  lugar: string;
  descripcion: string;
  estatusRegistro: 'Abierto' | 'Cerrado';
  registradosIds: string[];
}

export interface Poll {
  id: string;
  pregunta: string;
  descripcion: string;
  opciones: string[];
  fechaInicio: string;
  fechaFin: string;
  estatus: 'Borrador' | 'Publicada' | 'Finalizada';
  totalVotos: number;
}

export interface PollResponse {
  id: string;
  pollId: string;
  afiliadoId: string;
  voto: string;
}

export interface NewsPost {
  id: string;
  titulo: string;
  contenido: string;
  imagenUrl?: string;
  autor: string;
  fecha: string;
  categoria?: string;
}

export interface MonthlyDue {
  id: string;
  userId: string;
  month: string;
  year: number;
  amount: number;
  status: 'Pagado' | 'Pendiente';
  paymentDate?: string;
  reference?: string;
  comprobanteUrl?: string;
}

export interface PaymentRecord {
  id: string;
  afiliadoId: string;
  afiliadoName?: string;
  monto: number;
  mes: string;
  año: number;
  fechaDeposito: string;
  metodo: 'Transferencia' | 'PayPal' | 'Depósito' | 'Efectivo';
  referencia: string;
  comprobanteUrl?: string;
  estatus: 'Pendiente' | 'Validado' | 'Rechazado';
  notas: string;
  adminEditor: string;
  createdAt: string;
}
