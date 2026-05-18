# Football Team Balancer

MVP fullstack para equilibrar dois times de futebol com persistência em PostgreSQL.

## Estrutura do projeto

- `backend/server.js` - backend em Express que expõe as APIs de jogadores e equilíbrio de times.
- `backend/db.js` - conexão com PostgreSQL, criação de tabela e inicialização de dados.
- `backend/data/players.json` - dados iniciais usados apenas na primeira carga do banco.
- `src/App.jsx` - frontend em React que consome as APIs e permite edição de jogadores.
- `src/styles.css` - estilo responsivo para mobile.
- `vite.config.js` - proxy para enviar `/api` ao backend durante o desenvolvimento.

## Rotas principais

- `GET /api/players` - lista todos os jogadores persistidos
- `GET /api/teams` - retorna a divisão balanceada do time atual
- `POST /api/teams` - recebe `playerIds` e divide os times selecionados
- `PUT /api/players/:id` - atualiza posição e atributos de um jogador

## Pré-requisitos

- Node.js 18+ ou similar
- PostgreSQL instalado
- DBeaver (opcional, mas recomendado para gerenciar o banco visualmente)

## Configuração do PostgreSQL

Por padrão, o backend usa as variáveis de ambiente abaixo para conexão:

- `DATABASE_URL`
- ou `PGUSER`, `PGPASSWORD`, `PGHOST`, `PGPORT`, `PGDATABASE`

Exemplo de conexão padrão usada quando nenhuma variável está definida:

```bash
postgresql://postgres:postgres@localhost:5432/football
```

### Passo a passo com DBeaver

1. Abra o DBeaver.
2. Crie uma nova conexão PostgreSQL.
3. Use as credenciais do seu banco local.
4. Crie o banco `football` se ainda não existir.
5. Ao iniciar o backend, a tabela `players` será criada automaticamente e os dados iniciais serão carregados.

## Como rodar

### Backend

```bash
cd /home/hirata/Projects/backend
npm install
npm run dev
```

Se você usa variáveis de ambiente:

```bash
export PGUSER=postgres
export PGPASSWORD=senha
export PGHOST=localhost
export PGPORT=5432
export PGDATABASE=football
npm run dev
```

### Frontend

```bash
cd /home/hirata/Projects
npm install
npm run dev
```

O Vite redireciona `/api` para `http://localhost:4000` no desenvolvimento.

## Comportamento atual

- jogador editado é salvo no PostgreSQL via `PUT /api/players/:id`
- alterações persistem para as próximas sessões do app
- a divisão de times usa os dados atuais do banco

## Notas

- `backend/data/players.json` é apenas a fonte inicial para preencher o banco na primeira execução.
- Use DBeaver para inspecionar a tabela `players` e confirmar as alterações.

## Próximos passos possíveis

- suportar criação de novos jogadores
- adicionar autenticação e multiusuário
- exibir histórico de edições e partidas
- adicionar análise de equilíbrio avançada
