import { useEffect, useState } from 'react';

const ATTRIBUTES = ['velocidade', 'drible', 'finalizacao', 'passe', 'defesa'];
const ATTRIBUTE_LABELS = {
  velocidade: 'Velocidade',
  drible: 'Drible',
  finalizacao: 'Finalização',
  passe: 'Passe',
  defesa: 'Defesa',
};

function formatValue(value) {
  return value.toLocaleString('pt-BR');
}

function PlayerCard({ player }) {
  return (
    <article className="player-card">
      <div className="player-card-header">
        <strong>{player.name}</strong>
        {player.position && <span className="player-position">{player.position}</span>}
      </div>
      <div className="player-attributes">
        {ATTRIBUTES.map((attr) => (
          <div key={attr} className="attribute-row">
            <span>{ATTRIBUTE_LABELS[attr]}</span>
            <span>{player[attr]}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function TeamCard({ title, players, total }) {
  return (
    <section className="team-card">
      <header>
        <h2>{title}</h2>
        <div className="team-total">
          {ATTRIBUTES.map((attr) => (
            <span key={attr}>
              {ATTRIBUTE_LABELS[attr]}: {formatValue(total[attr])}
            </span>
          ))}
        </div>
      </header>
      <div className="team-list">
        {players.map((player) => (
          <PlayerCard key={player.id} player={player} />
        ))}
      </div>
    </section>
  );
}

function TeamPreviewCard({ title, players, total }) {
  return (
    <section className="preview-card">
      <header className="preview-header">
        <h2>{title}</h2>
        <div className="preview-total">
          {ATTRIBUTES.map((attr) => (
            <span key={attr}>
              {ATTRIBUTE_LABELS[attr]}: {formatValue(total[attr])}
            </span>
          ))}
        </div>
      </header>
      <div className="preview-list">
        {players.map((player) => (
          <div key={player.id} className="preview-item">
            <strong>{player.name}</strong>
            <span>{player.position || 'Sem posição'}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlayerSelectionItem({ player, checked, onToggle, onEdit }) {
  return (
    <label className="player-checkbox">
      <div className="player-checkbox-main">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(player.id)}
        />
        <span>{player.name} {player.position && `(${player.position})`}</span>
      </div>
      <button
        type="button"
        className="player-edit-button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onEdit(player);
        }}
        aria-label={`Editar ${player.name}`}
      >
        ⚙️
      </button>
    </label>
  );
}

function RadarGraph({ values }) {
  const size = 220;
  const center = size / 2;
  const radius = 80;
  const max = 5;
  const degrees = [-90, -18, 54, 126, 198];
  const initials = {
    velocidade: 'V',
    drible: 'D',
    finalizacao: 'F',
    passe: 'P',
    defesa: 'D',
  };
  const points = ATTRIBUTES.map((attr, index) => {
    const ratio = Math.max(0, Math.min(1, (values[attr] ?? 0) / max));
    const dist = 25 + ratio * radius;
    const angle = (degrees[index] * Math.PI) / 180;
    return `${center + dist * Math.cos(angle)},${center + dist * Math.sin(angle)}`;
  }).join(' ');

  return (
    <div className="radar-graph">
      <svg viewBox={`0 0 ${size} ${size}`} role="img" aria-label="Gráfico de atributos do jogador">
        {[0.25, 0.5, 0.75, 1].map((level) => {
          const levelRadius = 25 + level * radius;
          return (
            <polygon
              key={level}
              points={degrees.map((deg) => {
                const angle = (deg * Math.PI) / 180;
                return `${center + levelRadius * Math.cos(angle)},${center + levelRadius * Math.sin(angle)}`;
              }).join(' ')}
              fill="none"
              stroke="rgba(34, 197, 94, 0.2)"
            />
          );
        })}
        <polygon points={points} fill="rgba(34, 197, 94, 0.35)" stroke="#16a34a" strokeWidth="2" />
        {ATTRIBUTES.map((attr, index) => {
          const angle = (degrees[index] * Math.PI) / 180;
          const x = center + (radius + 30) * Math.cos(angle);
          const y = center + (radius + 30) * Math.sin(angle);
          return (
            <text key={attr} x={x} y={y} textAnchor={x < center ? 'end' : 'start'} dominantBaseline="middle" className="radar-label">
              {initials[attr]}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function EditPlayerScreen({ player, form, onFieldChange, onAttributeChange, onCancel, onSave }) {
  return (
    <section className="edit-screen">
      <div className="edit-header">
        <div>
          <p className="eyebrow">Editar jogador</p>
          <h2>{player.name}</h2>
          <p className="subtitle">Ajuste os atributos e a posição para atualizar o jogador.</p>
        </div>
      </div>

      <div className="edit-content">
        <div className="edit-form-card">
          <div className="avatar-shell">
            <div className="avatar-image">
              <span>{player.name.charAt(0)}</span>
            </div>
            <p className="avatar-action">Editar</p>
          </div>

          <label className="field-label">
            Posição
            <select value={form.position} onChange={(event) => onFieldChange('position', event.target.value)}>
              <option value="Goleiro">Goleiro</option>
              <option value="Defesa">Defesa</option>
              <option value="Meio">Meio</option>
              <option value="Ataque">Ataque</option>
            </select>
          </label>

          <div className="attribute-controls">
            {ATTRIBUTES.map((attr) => (
              <label key={attr} className="attribute-control">
                <span>{ATTRIBUTE_LABELS[attr]}: {form[attr]}</span>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={form[attr]}
                  onChange={(event) => onAttributeChange(attr, Number(event.target.value))}
                />
              </label>
            ))}
          </div>
        </div>

        <div className="edit-visual-card">
          <RadarGraph values={form} />
        </div>
      </div>

      <div className="edit-actions">
        <button type="button" className="secondary-button cancel-button" onClick={onCancel}>
          Cancelar
        </button>
        <button type="button" className="secondary-button" onClick={onSave}>
          Salvar alterações
        </button>
      </div>
    </section>
  );
}

export default function App() {
  const [allPlayers, setAllPlayers] = useState([]);
  const [selectedPlayerIds, setSelectedPlayerIds] = useState([]);
  const [teams, setTeams] = useState(null);
  const [view, setView] = useState('home');
  const [editingPlayer, setEditingPlayer] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isDividing, setIsDividing] = useState(false);
  const [error, setError] = useState('');
  const [theme, setTheme] = useState('light');

  const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const fetchPlayers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/players');
      if (!response.ok) {
        throw new Error('Não foi possível carregar os jogadores.');
      }

      const data = await response.json();
      setAllPlayers(data.players || []);
      setSelectedPlayerIds([]);
      setTeams(null);
    } catch (err) {
      setError(err.message || 'Erro de comunicação com o backend.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (player) => {
    setEditingPlayer(player);
    setEditForm({
      id: player.id,
      name: player.name,
      position: player.position || 'Defesa',
      velocidade: player.velocidade,
      drible: player.drible,
      finalizacao: player.finalizacao,
      passe: player.passe,
      defesa: player.defesa,
    });
    setView('edit');
  };

  const handleCancelEdit = () => {
    setEditingPlayer(null);
    setEditForm(null);
    setView('home');
  };

  const handleSaveEdit = async () => {
    try {
      const response = await fetch(`/api/players/${editForm.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          position: editForm.position,
          velocidade: editForm.velocidade,
          drible: editForm.drible,
          finalizacao: editForm.finalizacao,
          passe: editForm.passe,
          defesa: editForm.defesa,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao salvar o jogador.');
      }

      const updatedPlayer = await response.json();
      setAllPlayers((current) =>
        current.map((player) =>
          player.id === updatedPlayer.id ? updatedPlayer : player
        )
      );
      setEditingPlayer(null);
      setEditForm(null);
      setView('home');
    } catch (err) {
      setError(err.message || 'Erro ao salvar o jogador.');
    }
  };

  const handleEditFieldChange = (field, value) => {
    setEditForm((current) => ({ ...current, [field]: value }));
  };

  const handleEditAttributeChange = (attribute, value) => {
    setEditForm((current) => ({ ...current, [attribute]: value }));
  };

  const handlePlayerToggle = (playerId) => {
    setSelectedPlayerIds((current) =>
      current.includes(playerId)
        ? current.filter(id => id !== playerId)
        : [...current, playerId]
    );
  };

  const handleDivideTeams = async () => {
    if (selectedPlayerIds.length < 2) {
      setError('Selecione pelo menos 2 jogadores para dividir os times.');
      return;
    }

    setLoading(true);
    setIsDividing(true);
    setError('');

    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playerIds: selectedPlayerIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao dividir os times.');
      }

      const data = await response.json();
      await pause(2000);
      setTeams(data);
      setView('preview');
    } catch (err) {
      setError(err.message || 'Erro ao dividir os times.');
    } finally {
      setLoading(false);
      setIsDividing(false);
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  useEffect(() => {
    document.body.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <main className={`app-shell ${theme}`}>
      {view === 'home' && !loading && !isDividing && (
        <div className="top-bar">
          <div>
            <p className="eyebrow">MVP</p>
            <h1>Balanceador de times</h1>
            <p className="subtitle">
              Selecione os jogadores presentes e divida o time em duas equipes equilibradas com base nos atributos dos jogadores.
            </p>
          </div>
          <div className="top-actions">
            <div className="theme-toggle">
              <span className="theme-icon" aria-hidden="true">{theme === 'dark' ? '🌙' : '☀️'}</span>
              <button
                className={`theme-button ${theme === 'dark' ? 'on' : ''}`}
                aria-label={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
                onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
              />
            </div>
            <button className="secondary-button" onClick={handleDivideTeams} disabled={loading || selectedPlayerIds.length < 2}>
              Dividir times ({selectedPlayerIds.length} selecionados)
            </button>
          </div>
        </div>
      )}

      {view === 'home' && loading && isDividing ? (
        <div className="fullscreen-loading">
          <div className="loading-banner centered">
            <span>Dividindo os times...</span>
            <div className="progress-bar">
              <div className="progress-bar-fill" />
            </div>
          </div>
        </div>
      ) : view === 'edit' && editForm ? (
        <EditPlayerScreen
          player={editingPlayer}
          form={editForm}
          onFieldChange={handleEditFieldChange}
          onAttributeChange={handleEditAttributeChange}
          onCancel={handleCancelEdit}
          onSave={handleSaveEdit}
        />
      ) : view === 'preview' ? (
        <section className="preview-screen">
          <div className="preview-toolbar">
            <button className="secondary-button" onClick={() => setView('home')}>
              Voltar para seleção
            </button>
          </div>

          <div className="preview-grid">
            <TeamPreviewCard title="Time A" players={teams.teamA} total={teams.scoreA} />
            <TeamPreviewCard title="Time B" players={teams.teamB} total={teams.scoreB} />
          </div>
        </section>
      ) : loading && isDividing ? (
        <div className="empty-state" />
      ) : (
        <section className="content-grid">
          <div className="sidebar-card">
            <h2>Jogadores disponíveis</h2>
            <p>Marque os jogadores que estão presentes na partida.</p>

            {loading && <p>Carregando jogadores...</p>}
            {error && <p className="error-text">{error}</p>}

            {!loading && !error && (
              <div className="player-selection">
                {allPlayers.map((player) => (
                  <PlayerSelectionItem
                    key={player.id}
                    player={player}
                    checked={selectedPlayerIds.includes(player.id)}
                    onToggle={handlePlayerToggle}
                    onEdit={handleOpenEdit}
                  />
                ))}
              </div>
            )}

            <p className="hint">Selecione pelo menos 2 jogadores para dividir os times.</p>
          </div>

          {error ? (
            <div className="empty-state">
              <p>Ocorreu um erro ao buscar os times.</p>
            </div>
          ) : (
            <div className="empty-state">
              <p>Clique em "Dividir times" para gerar as equipes.</p>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
