import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDb, getPlayers, getPlayersByIds, updatePlayer } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ATTRIBUTES = ['velocidade', 'drible', 'finalizacao', 'passe', 'defesa'];

function calculateTeamBalance(players) {
  return players.reduce((acc, player) => {
    ATTRIBUTES.forEach((attr) => {
      acc[attr] += player[attr];
    });
    return acc;
  }, Object.fromEntries(ATTRIBUTES.map((attr) => [attr, 0])));
}

function teamScoreDiff(teamA, teamB) {
  return ATTRIBUTES.reduce((diff, attr) => diff + Math.abs(teamA[attr] - teamB[attr]), 0);
}

function getPlayerTotal(player) {
  return ATTRIBUTES.reduce((sum, attr) => sum + player[attr], 0);
}

function countPositions(players) {
  return {
    goleiro: players.filter(p => p.position === 'Goleiro').length,
    defesa: players.filter(p => p.position === 'Defesa').length,
    meio: players.filter(p => p.position === 'Meio').length,
    ataque: players.filter(p => p.position === 'Ataque').length,
  };
}

function positionDifference(posCountA, posCountB) {
  return Math.abs(posCountA.defesa - posCountB.defesa) +
         Math.abs(posCountA.meio - posCountB.meio) +
         Math.abs(posCountA.ataque - posCountB.ataque);
}

function getCombinedSplitScore(scoreA, scoreB, posCountA, posCountB) {
  const diff = teamScoreDiff(scoreA, scoreB);
  const posDiff = positionDifference(posCountA, posCountB);
  const POSITION_WEIGHT = 0.3; // posição é um complemento leve
  return diff + posDiff * POSITION_WEIGHT;
}

function getBestSplit(players) {
  const playerCount = players.length;
  if (playerCount < 2) {
    return null;
  }

  const goalkeeperCount = players.filter((player) => player.position === 'Goleiro').length;
  const teamSize = Math.floor(playerCount / 2);

  if (playerCount <= 16) {
    const combinations = [];

    function generate(index, chosen) {
      if (chosen.length === teamSize) {
        const chosenGoalkeepers = chosen.filter((player) => player.position === 'Goleiro').length;
        // Se há exatamente 2 goleiros, cada time deve ter exatamente 1
        // Se há menos de 2 goleiros, permitir 0 ou 1 por time
        const validGoalkeepers = goalkeeperCount === 2 ? chosenGoalkeepers === 1 : chosenGoalkeepers <= 1;
        if (validGoalkeepers) {
          combinations.push([...chosen]);
        }
        return;
      }
      if (index >= playerCount) return;
      generate(index + 1, chosen);
      chosen.push(players[index]);
      generate(index + 1, chosen);
      chosen.pop();
    }

    generate(0, []);

    let best = null;
    let bestCombined = Infinity;
    let bestDiff = Infinity;

    for (const teamA of combinations) {
      const teamB = players.filter((player) => !teamA.includes(player));
      const scoreA = calculateTeamBalance(teamA);
      const scoreB = calculateTeamBalance(teamB);
      const diff = teamScoreDiff(scoreA, scoreB);

      const posCountA = countPositions(teamA);
      const posCountB = countPositions(teamB);
      const combined = getCombinedSplitScore(scoreA, scoreB, posCountA, posCountB);

      if (combined < bestCombined || (combined === bestCombined && diff < bestDiff)) {
        bestCombined = combined;
        bestDiff = diff;
        best = { teamA, teamB, scoreA, scoreB, diff, posCountA, posCountB };
      }
    }

    return best;
  }

  // Para mais de 16 jogadores, usar heurística
  const sortedPlayers = [...players].sort((a, b) => getPlayerTotal(b) - getPlayerTotal(a));
  const teamA = [];
  const teamB = [];

  for (const player of sortedPlayers) {
    if (teamA.length < teamSize && teamB.length < teamSize) {
      const scoreA = calculateTeamBalance([...teamA, player]);
      const scoreB = calculateTeamBalance(teamB);
      const posCountA = countPositions([...teamA, player]);
      const posCountB = countPositions(teamB);
      const combinedA = getCombinedSplitScore(scoreA, scoreB, posCountA, posCountB);

      const scoreA2 = calculateTeamBalance(teamA);
      const scoreB2 = calculateTeamBalance([...teamB, player]);
      const posCountA2 = countPositions(teamA);
      const posCountB2 = countPositions([...teamB, player]);
      const combinedB = getCombinedSplitScore(scoreA2, scoreB2, posCountA2, posCountB2);

      if (combinedA <= combinedB) {
        teamA.push(player);
      } else {
        teamB.push(player);
      }
    } else if (teamA.length < teamSize) {
      teamA.push(player);
    } else {
      teamB.push(player);
    }
  }

  const scoreA = calculateTeamBalance(teamA);
  const scoreB = calculateTeamBalance(teamB);
  const diff = teamScoreDiff(scoreA, scoreB);

  return { teamA, teamB, scoreA, scoreB, diff };
}

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/players', async (req, res) => {
  try {
    const players = await getPlayers();
    res.json({ players });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao carregar os jogadores.' });
  }
});

app.get('/api/teams', async (req, res) => {
  try {
    const players = await getPlayers();
    const split = getBestSplit(players);
    res.json({ players, ...split });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao carregar os jogadores.' });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { playerIds } = req.body;
    if (!Array.isArray(playerIds) || playerIds.length < 2) {
      return res.status(400).json({ error: 'É necessário pelo menos 2 jogadores selecionados.' });
    }

    const selectedPlayers = await getPlayersByIds(playerIds);

    if (selectedPlayers.length !== playerIds.length) {
      return res.status(400).json({ error: 'Alguns jogadores selecionados não foram encontrados.' });
    }

    const split = getBestSplit(selectedPlayers);
    res.json({ players: selectedPlayers, ...split });
  } catch (error) {
    res.status(500).json({ error: 'Falha ao processar os jogadores selecionados.' });
  }
});

app.put('/api/players/:id', async (req, res) => {
  try {
    const playerId = Number(req.params.id);
    const { position, velocidade, drible, finalizacao, passe, defesa } = req.body;

    if (!playerId || !position) {
      return res.status(400).json({ error: 'ID do jogador e posição são obrigatórios.' });
    }

    const updated = await updatePlayer(playerId, {
      position,
      velocidade,
      drible,
      finalizacao,
      passe,
      defesa,
    });

    if (!updated) {
      return res.status(404).json({ error: 'Jogador não encontrado.' });
    }

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao atualizar o jogador.' });
  }
});

await initDb();

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Backend rodando em http://localhost:${port}`);
});
