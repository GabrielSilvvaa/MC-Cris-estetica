// ============================================================================
// TESTE AUTOMATIZADO DE RBAC — API MC ESTÉTICA & BEM-ESTAR
// Valida respostas HTTP 401 (Não autenticado), 403 (Recepcionista barrada)
// e 200/201 (Admin autorizado) diretamente via requisições HTTP na API Express.
// ============================================================================

process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../server';

let server: http.Server;
const PORT = 3999;
const BASE_URL = `http://localhost:${PORT}/api`;

interface TestResult {
  name: string;
  expectedStatus: number;
  actualStatus: number;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function makeRequest(
  method: string,
  path: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<{ status: number; data: any }> {
  return new Promise((resolve, reject) => {
    const url = new URL(`${BASE_URL}${path}`);
    const req = http.request(
      url,
      {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let data = {};
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({ status: res.statusCode || 500, data });
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest(
  name: string,
  method: string,
  path: string,
  expectedStatus: number,
  headers: Record<string, string> = {},
  body?: any
) {
  try {
    const { status } = await makeRequest(method, path, headers, body);
    const passed = status === expectedStatus;
    results.push({ name, expectedStatus, actualStatus: status, passed });
    const symbol = passed ? '✅' : '❌';
    console.log(`  ${symbol} [HTTP ${status} == ${expectedStatus}] ${name}`);
  } catch (err: any) {
    results.push({ name, expectedStatus, actualStatus: -1, passed: false, error: err.message });
    console.log(`  ❌ [ERROR] ${name}: ${err.message}`);
  }
}

async function runAllRBACTests() {
  console.log('\n================================================================');
  console.log('🔒 INICIANDO SUÍTE DE TESTES AUTOMATIZADOS DE RBAC (HTTP 401/403/200)');
  console.log('================================================================\n');

  // Headers
  const noAuth: Record<string, string> = {};
  const recepAuth = { 'x-user-id': 'user-recep-1' };
  const adminAuth = { 'x-user-id': 'user-admin-1' };

  console.log('--- 1. TESTES DE REQUISIÇÃO NÃO AUTENTICADA (Esperado: 401 Unauthorized) ---');
  await runTest('GET /financeiro/relatorio sem auth -> 401', 'GET', '/financeiro/relatorio', 401, noAuth);
  await runTest('GET /clientes sem auth -> 401', 'GET', '/clientes', 401, noAuth);
  await runTest('GET /configuracoes/horarios sem auth -> 401', 'GET', '/configuracoes/horarios', 401, noAuth);

  console.log('\n--- 2. TESTES DE ACESSO RESTRITO / PERFIL RECEPCIONISTA (Esperado: 403 Forbidden) ---');
  await runTest(
    'GET /financeiro/relatorio como Recepcionista -> 403 Forbidden',
    'GET',
    '/financeiro/relatorio',
    403,
    recepAuth
  );
  await runTest(
    'GET /financeiro/atendimentos como Recepcionista -> 403 Forbidden',
    'GET',
    '/financeiro/atendimentos',
    403,
    recepAuth
  );
  await runTest(
    'POST /procedimentos (Criar) como Recepcionista -> 403 Forbidden',
    'POST',
    '/procedimentos',
    403,
    recepAuth,
    { nome: 'Novo Procedimento Teste', preco_padrao: 350 }
  );
  await runTest(
    'PUT /procedimentos/proc-1 (Editar) como Recepcionista -> 403 Forbidden',
    'PUT',
    '/procedimentos/proc-1',
    403,
    recepAuth,
    { preco_padrao: 400 }
  );
  await runTest(
    'DELETE /procedimentos/proc-1 (Excluir) como Recepcionista -> 403 Forbidden',
    'DELETE',
    '/procedimentos/proc-1',
    403,
    recepAuth
  );
  await runTest(
    'GET /clientes/cli-1/lgpd-exportar como Recepcionista -> 403 Forbidden',
    'GET',
    '/clientes/cli-1/lgpd-exportar',
    403,
    recepAuth
  );
  await runTest(
    'DELETE /clientes/cli-1/lgpd-excluir como Recepcionista -> 403 Forbidden',
    'DELETE',
    '/clientes/cli-1/lgpd-excluir',
    403,
    recepAuth
  );
  await runTest(
    'GET /configuracoes/horarios como Recepcionista -> 403 Forbidden',
    'GET',
    '/configuracoes/horarios',
    403,
    recepAuth
  );
  await runTest(
    'POST /configuracoes/horarios como Recepcionista -> 403 Forbidden',
    'POST',
    '/configuracoes/horarios',
    403,
    recepAuth,
    { horarios: [] }
  );
  await runTest(
    'POST /configuracoes/bloqueios como Recepcionista -> 403 Forbidden',
    'POST',
    '/configuracoes/bloqueios',
    403,
    recepAuth,
    { data: '2026-12-25', motivo: 'Feriado' }
  );
  await runTest(
    'GET /configuracoes/usuarios como Recepcionista -> 403 Forbidden',
    'GET',
    '/configuracoes/usuarios',
    403,
    recepAuth
  );

  console.log('\n--- 3. TESTES DE OPERAÇÕES PERMITIDAS À RECEPCIONISTA (Esperado: 200/201) ---');
  await runTest('GET /clientes como Recepcionista -> 200 OK', 'GET', '/clientes', 200, recepAuth);
  await runTest('GET /agenda como Recepcionista -> 200 OK', 'GET', '/agenda', 200, recepAuth);
  await runTest('GET /leads como Recepcionista -> 200 OK', 'GET', '/leads', 200, recepAuth);
  await runTest('GET /procedimentos (Consulta) como Recepcionista -> 200 OK', 'GET', '/procedimentos', 200, recepAuth);
  await runTest(
    'POST /clientes/cli-1/lgpd-solicitar (Entra na fila) como Recepcionista -> 201 Created',
    'POST',
    '/clientes/cli-1/lgpd-solicitar',
    201,
    recepAuth,
    { tipo: 'exportacao', motivo: 'Solicitação de prontuário' }
  );
  await runTest(
    'POST /financeiro/pagamento (Registro pontual) como Recepcionista -> 201 Created',
    'POST',
    '/financeiro/pagamento',
    201,
    recepAuth,
    {
      cliente_id: 'cli-1',
      procedimento_id: 'proc-1',
      valor_cobrado: 280,
      forma_pagamento: 'pix',
      status_pagamento: 'pago'
    }
  );

  console.log('\n--- 4. TESTES DE OPERAÇÕES DO ADMINISTRADOR (Esperado: 200/201) ---');
  await runTest('GET /financeiro/relatorio como Admin -> 200 OK', 'GET', '/financeiro/relatorio', 200, adminAuth);
  await runTest('GET /clientes/cli-1/lgpd-exportar como Admin -> 200 OK', 'GET', '/clientes/cli-1/lgpd-exportar', 200, adminAuth);
  await runTest('GET /configuracoes/horarios como Admin -> 200 OK', 'GET', '/configuracoes/horarios', 200, adminAuth);
  await runTest('GET /configuracoes/usuarios como Admin -> 200 OK', 'GET', '/configuracoes/usuarios', 200, adminAuth);

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  console.log('\n================================================================');
  console.log(`📊 RESULTADO FINAL DOS TESTES RBAC: ${passedCount}/${totalCount} testes passaram com sucesso.`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

// Inicializa servidor de teste em porta dedicada
server = app.listen(PORT, async () => {
  try {
    await runAllRBACTests();
  } finally {
    server.close();
  }
});
