/**
 * Utilitários de Validação e Formatação de CPF
 * Sistema MC Estética & Bem-Estar
 */

/**
 * Valida o formato e os dígitos verificadores de um CPF brasileiro.
 * Aceita tanto "000.000.000-00" quanto "00000000000".
 */
export function validarCPF(cpf: string): boolean {
  if (!cpf || typeof cpf !== 'string') return false;

  const limpo = cpf.replace(/\D/g, '');

  // CPF deve conter exatamente 11 dígitos numéricos
  if (limpo.length !== 11) return false;

  // Rejeita sequências com todos os dígitos iguais (ex: 000.000.000-00, 111.111.111-11, etc.)
  if (/^(\d)\1{10}$/.test(limpo)) return false;

  // Validação do 1º dígito verificador
  let soma = 0;
  for (let i = 0; i < 9; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (10 - i);
  }
  let resto = 11 - (soma % 11);
  const digito1 = resto >= 10 ? 0 : resto;
  if (digito1 !== parseInt(limpo.charAt(9), 10)) return false;

  // Validação do 2º dígito verificador
  soma = 0;
  for (let i = 0; i < 10; i++) {
    soma += parseInt(limpo.charAt(i), 10) * (11 - i);
  }
  resto = 11 - (soma % 11);
  const digito2 = resto >= 10 ? 0 : resto;
  if (digito2 !== parseInt(limpo.charAt(10), 10)) return false;

  return true;
}

/**
 * Formata uma string de CPF para a máscara padrão "000.000.000-00".
 */
export function formatarCPF(cpf: string): string {
  if (!cpf) return '';
  const limpo = cpf.replace(/\D/g, '');
  if (limpo.length !== 11) return cpf;
  return limpo.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
