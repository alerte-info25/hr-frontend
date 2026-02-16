// src/app/models/permission.model.ts
export interface Permission {
  id?: number;
  employeeId: number;
  employeeName?: string;
  type: PermissionType;
  startDate: Date;
  endDate: Date;
  reason: string;
  status: PermissionStatus;
  requestDate: Date;
  responseDate?: Date;
  adminComment?: string;
  documents?: string[]; // URLs des documents justificatifs
}

export enum PermissionType {
  CONGE_ANNUEL = 'CONGE_ANNUEL',
  CONGE_MALADIE = 'CONGE_MALADIE',
  CONGE_MATERNITE = 'CONGE_MATERNITE',
  CONGE_PATERNITE = 'CONGE_PATERNITE',
  CONGE_SANS_SOLDE = 'CONGE_SANS_SOLDE',
  FORMATION = 'FORMATION',
  MISSION = 'MISSION',
  AUTRE = 'AUTRE'
}

export enum PermissionStatus {
  EN_ATTENTE = 'EN_ATTENTE',
  APPROUVEE = 'APPROUVEE',
  REFUSEE = 'REFUSEE',
  ANNULEE = 'ANNULEE'
}

export interface PermissionSummary {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  totalDays: number;
}

// src/app/models/user.model.ts (extension)
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  MANAGER = 'MANAGER'
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  employeeId?: number;
}
