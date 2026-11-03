// A seleção usa o índice original de cada linha para sobreviver à ordenação e aos filtros.
const escolhidas = new Set();
const limite = 20;
const painel = document.querySelector('#painel');
const abrirResumo = document.querySelector('#abrir');
const linhas = [...document.querySelectorAll('tbody tr')];
const nomes = linhas.map(linha => linha.cells[0].firstChild.textContent);
const descricoes = linhas.map(linha => linha.cells[5].textContent);
const seletores = [];
function elemento(tag, texto) {
  const el = document.createElement(tag);
  el.textContent = texto;
  return el;
}

for (const linha of linhas) {
  const i = Number(linha.dataset.i);
  const celula = linha.cells[0];

  // Colocar a seleção no nome mantém as colunas de ordenação originais.
  const caixa = document.createElement('input');
  caixa.type = 'checkbox';
  caixa.className = 'pick';
  caixa.setAttribute('aria-label', 'Selecionar ' + nomes[i]);
  caixa.onchange = () => {
    if (caixa.checked && escolhidas.size < limite) {
      if (!escolhidas.size && painel.hidden) abrirResumo.click();
      escolhidas.add(i);
    }
    else escolhidas.delete(i);
    atualizar();
  };
  celula.prepend(caixa);
  seletores[i] = caixa;
}
function soma(mapa, parcelas) {
  for (const [nome, unidade, valor] of parcelas) {
    const chave = JSON.stringify([nome, unidade]);
    mapa.set(chave, (mapa.get(chave) || 0) + valor);
  }
}
function valorFormatado(valor, unidade) {
  return (valor > 0 ? '+' : '') + valor.toLocaleString('pt-BR', {maximumFractionDigits: 3}) + unidade;
}
function atualizar() {
  const cheio = escolhidas.size === limite;
  document.querySelector('#contador').textContent = escolhidas.size + ' / 20 cartas' + (cheio ? ' · Limite atingido' : ' selecionadas');
  for (const [i, caixa] of seletores.entries()) {
    caixa.checked = escolhidas.has(i);
    caixa.disabled = cheio && !caixa.checked;
  }
  const conteudo = document.querySelector('#conteudo');
  conteudo.replaceChildren();
  if (!escolhidas.size) {
    conteudo.append(elemento('p','Marque as caixas ao lado dos nomes para calcular os efeitos.'));
    return;
  }
  const totais = new Map(), conjuntos = new Map();
  const lista = elemento('ul','');
  for (const i of escolhidas) {
    soma(totais, efeitosCartas[i]);
    for (const familia of rows[i][4]) conjuntos.set(familia,(conjuntos.get(familia) || 0) + 1);
    const item = elemento('li','');
    const remover = elemento('button','Remover');
    remover.setAttribute('aria-label','Remover ' + nomes[i]);
    remover.onclick = () => { escolhidas.delete(i); atualizar(); };
    item.append(remover, elemento('strong',nomes[i] + ' · '), document.createTextNode(descricoes[i]));
    lista.append(item);
  }
  const progresso = elemento('ul','');
  for (const [familia, qtd] of conjuntos) {
    const atingidas = faixas[familia].filter(([pecas]) => pecas <= qtd);
    const ativas = atingidas;
    const item = elemento('li',familia + ' · ' + qtd + (qtd===1?' peça':' peças'));
    for (const [pecas, efeitos] of ativas) {
      soma(totais, efeitos);
      item.append(elemento('div',pecas+' peças: '+efeitos.map(([n,u,v])=>n+' '+valorFormatado(v,u)).join(', ')));
    }
    if (!ativas.length) item.append(document.createTextNode(' · Sem bônus ativo'));
    progresso.append(item);
  }
  const total = elemento('ul','');
  for (const [chave,v] of [...totais].sort(([a],[b])=>a.localeCompare(b,'pt-BR'))) {
    const [n,u]=JSON.parse(chave);
    total.append(elemento('li',n+' '+valorFormatado(v,u)));
  }
  conteudo.append(elemento('h3','Total das cartas e dos conjuntos'),total,elemento('p','Pontos e percentuais são somados separadamente. Ativações, imunidades, passivas e efeitos condicionais aparecem na descrição de cada carta.'),elemento('h3','Conjuntos'),progresso,elemento('h3','Cartas selecionadas e efeitos'),lista);
}
abrirResumo.onclick = () => {
  painel.hidden = !painel.hidden;
  abrirResumo.setAttribute('aria-expanded',String(!painel.hidden));
  abrirResumo.textContent = painel.hidden ? 'Ver somatório' : 'Recolher somatório';
};
atualizar();

