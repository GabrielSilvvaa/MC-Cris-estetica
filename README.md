          
## 1. Pré-requisitos

Antes de começar, cada pessoa precisa ter instalado na própria máquina:

- **Node.js** (versão 18 ou superior) — [nodejs.org](https://nodejs.org)
- **Git** — [git-scm.com](https://git-scm.com)
- Um editor de código (recomendado: o próprio Antigravity IDE, ou VS Code)
        
Para conferir se já está tudo instalado, abra  um terminal e rode:

```bash
node --version
npm --version
git --version
```

Se algum desses comandos der erro de "comando não encontrado", instale a ferramenta correspondente antes de continuar.

---

## 2. Clonando o projeto

No terminal, navegue até a pasta onde você quer salvar o projeto e rode:

```bash
git clone https://github.com/GabrielSilvvaa/MC-Cris-estetica.git
cd MC-Cris-estetica
```

Isso vai baixar todo o projeto para a sua máquina, dentro de uma pasta chamada `MC-Cris-estetica`.

---

## 3. Estrutura do projeto

```
mc-estetica-app/
├── backend/     → Servidor (Node.js + Express + TypeScript)
├── frontend/    → Interface web (React + TypeScript + Tailwind CSS)
└── README.md    → Este arquivo
```

O projeto é dividido em duas partes independentes que rodam ao mesmo tempo:
- **Backend**: expõe a API (dados, regras de negócio) na porta `3001`.
- **Frontend**: é a tela que o usuário vê no navegador, na porta `5173`.

---

## 4. Como rodar o sistema localmente

Você vai precisar de **dois terminais abertos ao mesmo tempo** (um para o backend, outro para o frontend). Os dois precisam
ficar rodando continuamente enquanto você usa o sistema.

### Terminal 1 — Backend

```bash
cd backend
npm install
npm run dev
```

Se der tudo certo, vai aparecer uma mensagem indicando que o servidor está rodando em `http://localhost:3001`. Deixe esse terminal aberto.

### Terminal 2 — Frontend

Abra um **novo terminal** (não feche o do backend) e rode:

```bash
cd frontend
npm install
npm run dev
```

Vai aparecer uma mensagem com o endereço `http://localhost:5173`. Deixe esse terminal aberto também.

### Acessando o sistema

Com os dois terminais rodando, abra o navegador em:

```
http://localhost:5173
```

> ⚠️ **Sobre o login:** o login real com Google ainda não está implementado (veja seção 6). Por enquanto,
>  existe um alternador de perfil temporário só para testes (marcado no código como `// TODO: REMOVER EM PRODUÇÃO`),
> que permite entrar como Administrador ou Recepcionista sem autenticação real.

---

## 5. Onde implementar o Banco de Dados

Atualmente, **todos os dados do sistema são armazenados em memória** (ou seja, toda vez que o backend reinicia, 
os dados voltam ao estado inicial). Isso foi proposital: o projeto foi construído com uma camada de repositório desacoplada,
para que o banco de dados real seja plugado sem precisar reescrever as regras de negócio.

**Onde procurar:**

- `backend/src/repositories/interfaces.ts` — contém as **interfaces** de cada entidade do sistema
- (Cliente, Agendamento, Procedimento, etc.).
- É esse "contrato" que a implementação real do banco precisa respeitar.
- `backend/src/repositories/InMemoryStore.ts` —
-  é a implementação **provisória** em memória. É aqui que estão os comentários `// TODO: [DB TEAM]`,
-   indicando exatamente qual consulta/operação (SELECT, INSERT, UPDATE, DELETE) deve ser implementada em cada função,
-   quando o banco real for conectado.

Para encontrar todos os pontos de uma vez, rode este comando na raiz do projeto:

```bash
grep -rn "TODO: \[DB TEAM\]" backend/src
```

**Sugestão de abordagem:** criar uma nova implementação das mesmas interfaces 
(ex: `PostgresStore.ts` ou usando um ORM como Prisma/Drizzle) e trocar qual implementação é injetada nos serviços, 
sem precisar alterar `services/`, `controllers/` ou `routes/`.

---

## 6. Onde implementar as APIs externas

Da mesma forma, as integrações externas foram isoladas em arquivos próprios,
com comentários indicando exatamente onde a implementação real deve entrar:

| Integração | Arquivo | O que falta |
|---|---|---|
| **Login com Google (OAuth 2.0)** | `frontend/src/pages/LoginPage.tsx` e `backend/src/routes/authRoutes.ts` |
Substituir o mock/alternador de perfil pela autenticação real do Google |

| **Google Calendar** | `backend/src/integrations/googleCalendar.ts` | Conectar a agenda institucional da clínica via Google Calendar API |

| **Google Drive** | `backend/src/integrations/googleDrive.ts` | Armazenamento das fotos antes/depois dos atendimentos |

| **Bot do WhatsApp (Meta API)** | `backend/src/integrations/whatsappBot.ts` | Endpoint que recebe leads e dispara lembretes de atendimento
(o bot em si é um projeto separado) |

Para localizar todos os pontos de integração de uma vez:

```bash
grep -rn "TODO: \[INTEGRAÇÃO" backend/src frontend/src
```

---

## 7. Fluxo de trabalho em equipe (Git)

Para evitar conflitos trabalhando em grupo, sugerimos o seguinte fluxo básico:

1. **Antes de começar a mexer em qualquer coisa**, sempre atualize sua cópia local:
   ```bash
   git pull
   ```

2. Faça suas alterações no código.

3. Para enviar suas alterações ao repositório:
   ```bash
   git add .
   git commit -m "descreva o que você mudou"
   git push
   ```

> 💡 **Recomendação:** se mais de uma pessoa for mexer no projeto ao mesmo tempo,
>  considerem criar uma branch separada para cada frente de trabalho (ex: `git checkout -b banco-de-dados`)
>  e só juntar (merge) ao `main` quando a parte estiver testada. Isso evita que o trabalho de uma pessoa sobrescreva o de outra.

---

## 8. Design System (para referência visual)

- **Cores:** bege/nude `#C4A883`, fundo off-white `#FAF6F0`, rosa claro de acento, textos em marrom escuro `#4A3F35` /
-  grafite `#2D241E` (contraste alto, WCAG AA).
- **Tipografia:** títulos em fonte serifada leve (Playfair Display) + toque manuscrito (Great Vibes);
- corpo do sistema em sans-serif neutra (Inter / Plus Jakarta Sans).
- **Estilo:** moderno com toques orgânicos — cantos arredondados, formas fluidas.

Esses padrões já estão aplicados no front-end (`frontend/src/index.css` e componentes). 
Ao criar novas telas ou componentes, mantenha a consistência com esse design system.

---

## 9. Dúvidas

Qualquer dúvida sobre as regras de negócio (ex: duração fixa de atendimento, regra de cancelamento de 48h, permissões de cada perfil) 
está documentada nos comentários do código, principalmente em `backend/src/services/`. Em caso de dúvida sobre uma decisão de produto 
(o "porquê" de alguma regra), falem com a Dra. Márcia ou com quem estruturou o escopo do projeto antes de alterar o comportamento.
