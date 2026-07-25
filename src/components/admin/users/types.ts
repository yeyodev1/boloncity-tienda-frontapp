export type UserForm = { email: string; password: string; name: string; phone: string; accountType: 'customer' | 'branch_admin' | 'admin'; branches: string[]; allBranches: boolean }
export const accountTypes = [{ value: 'customer', label: 'Cliente' }, { value: 'branch_admin', label: 'Administrador de sucursal' }, { value: 'admin', label: 'Administrador' }]
