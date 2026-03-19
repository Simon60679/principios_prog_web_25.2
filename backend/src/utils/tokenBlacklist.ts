/**
 * Armazena tokens JWT que foram invalidados (ex: após logout).
 * Utilizado pelo middleware de autenticação para rejeitar requisições com estes tokens.
 * Nota: Em produção, uma solução como Redis seria mais adequada para persistência e expiração automática.
 */
export const tokenBlacklist = new Set<string>();