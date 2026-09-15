// ============================================================================
// TESTES AUTOMATIZADOS — VALIDAÇÃO DE CPF E CADASTRO DE CLIENTES
// Valida:
// 1. Rejeição de cadastro sem CPF (400)
// 2. Rejeição de cadastro com CPF inválido/formato incorreto (400)
// 3. Rejeição de cadastro com CPF duplicado (400)
// 4. Sucesso no cadastro com CPF válido (201)
// 5. Busca de clientes por CPF formatado e numérico
// ============================================================================

process.env.NODE_ENV = 'test';
import http from 'http';
import app from '../server';

let server: http.Server;
const PORT = 3998;
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
  body?: any,
  validator?: (data: any) => boolean
) {
  try {
    const { status, data } = await makeRequest(method, path, headers, body);
    const statusMatch = status === expectedStatus;
    const bodyMatch = validator ? validator(data) : true;
    const passed = statusMatch && bodyMatch;
    results.push({ name, expectedStatus, actualStatus: status, passed });
    const symbol = passed ? '✅' : '❌';
    console.log(`  ${symbol} [HTTP ${status} == ${expectedStatus}] ${name}`);
    if (!passed && data?.erro) {
      console.log(`     Mensagem retornada: "${data.erro}"`);
    }
  } catch (err: any) {
    results.push({ name, expectedStatus, actualStatus: -1, passed: false, error: err.message });
    console.log(`  ❌ [ERROR] ${name}: ${err.message}`);
  }
}

async function runCPFValidationTests() {
  console.log('\n================================================================');
  console.log('🔒 INICIANDO TESTES AUTOMATIZADOS DE CPF OBRIGATÓRIO & REGRAS LGPD');
  console.log('================================================================\n');

  const authHeader = { 'x-user-id': 'user-admin-1' };

  console.log('--- 1. TESTES DE REJEIÇÃO POR CPF AUSENTE OU INVÁLIDO (Esperado: 400 Bad Request) ---');

  // Sem CPF
  await runTest(
    'POST /clientes sem CPF -> 400 Bad Request',
    'POST',
    '/clientes',
    400,
    authHeader,
    {
      nome: 'Cliente Sem CPF',
      telefone: '(11) 98888-0001',
      email: 'semcpf@teste.com'
    },
    (data) => data?.erro?.includes('CPF é obrigatório')
  );

  // CPF com tamanho inválido
  await runTest(
    'POST /clientes com CPF incompleto -> 400 Bad Request',
    'POST',
    '/clientes',
    400,
    authHeader,
    {
      nome: 'Cliente CPF Curto',
      cpf: '123.456',
      telefone: '(11) 98888-0002'
    },
    (data) => data?.erro?.includes('CPF inválido')
  );

  // CPF com todos os dígitos iguais (inválido pela regra de verificação da Receita)
  await runTest(
    'POST /clientes com CPF de dígitos repetidos (111.111.111-11) -> 400 Bad Request',
    'POST',
    '/clientes',
    400,
    authHeader,
    {
      nome: 'Cliente Digitos Repetidos',
      cpf: '111.111.111-11',
      telefone: '(11) 98888-0003'
    },
    (data) => data?.erro?.includes('CPF inválido')
  );

  console.log('\n--- 2. TESTE DE CADASTRO COM CPF VÁLIDO (Esperado: 201 Created) ---');

  // CPF válido matematicamente: 456.789.012-30 -> 45678901230 (ou 839.204.610-34)
  // Vamos usar um CPF válido: 529.982.247-25
  await runTest(
    'POST /clientes com CPF válido -> 201 Created',
    'POST',
    '/clientes',
    201,
    authHeader,
    {
      nome: 'Cliente Novo Teste',
      cpf: '529.982.247-25',
      telefone: '(11) 97777-1234',
      email: 'clientenovo@teste.com',
      data_nascimento: '1995-04-12'
    },
    (data) => data?.cpf === '529.982.247-25' && data?.nome === 'Cliente Novo Teste'
  );

  console.log('\n--- 3. TESTE DE DUPLICIDADE DE CPF (Esperado: 400 Bad Request) ---');

  // Tentativa de cadastrar novamente com o mesmo CPF
  await runTest(
    'POST /clientes com CPF já cadastrado -> 400 Bad Request com erro amigável',
    'POST',
    '/clientes',
    400,
    authHeader,
    {
      nome: 'Outro Cliente Com Mesmo CPF',
      cpf: '529.982.247-25',
      telefone: '(11) 96666-9999',
      email: 'outro@teste.com'
    },
    (data) => data?.erro?.includes('Já existe um cliente cadastrado com este CPF')
  );

  // Tentativa de cadastrar com CPF do Seed (111.444.777-35)
  await runTest(
    'POST /clientes com CPF de seed existente (111.444.777-35) -> 400 Bad Request',
    'POST',
    '/clientes',
    400,
    authHeader,
    {
      nome: 'Duplicado Seed',
      cpf: '11144477735', // enviado sem formatação
      telefone: '(11) 95555-4444'
    },
    (data) => data?.erro?.includes('Já existe um cliente cadastrado com este CPF')
  );

  console.log('\n--- 4. TESTE DE BUSCA DE CLIENTES POR CPF (Esperado: 200 OK) ---');

  await runTest(
    'GET /clientes?busca=529.982.247-25 -> 200 OK com cliente encontrado',
    'GET',
    '/clientes?busca=529.982.247-25',
    200,
    authHeader,
    undefined,
    (data) => Array.isArray(data) && data.length > 0 && data[0].cpf === '529.982.247-25'
  );

  await runTest(
    'GET /clientes?busca=52998224725 (numérico) -> 200 OK com cliente encontrado',
    'GET',
    '/clientes?busca=52998224725',
    200,
    authHeader,
    undefined,
    (data) => Array.isArray(data) && data.length > 0 && data[0].cpf === '529.982.247-25'
  );

  const passedCount = results.filter((r) => r.passed).length;
  const totalCount = results.length;

  console.log('\n================================================================');
  console.log(`📊 RESULTADO DOS TESTES DE CPF: ${passedCount}/${totalCount} testes passaram com sucesso.`);
  console.log('================================================================\n');

  if (passedCount !== totalCount) {
    process.exit(1);
  }
}

server = app.listen(PORT, async () => {
  try {
    await runCPFValidationTests();
  } finally {
    server.close();
  }
});
