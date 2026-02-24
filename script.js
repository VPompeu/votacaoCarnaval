const STORAGE_KEY = "avaliacoes_carnaval";

const form = document.getElementById("avaliacaoForm");
const limparTudoBtn = document.getElementById("limparTudo");
const tabelaAvaliacoes = document.getElementById("tabelaAvaliacoes");
const tabelaRanking = document.getElementById("tabelaRanking");
const vencedorEl = document.getElementById("vencedor");

function obterAvaliacoes() {
	try {
		return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
	} catch {
		return [];
	}
}

function salvarAvaliacoes(avaliacoes) {
	localStorage.setItem(STORAGE_KEY, JSON.stringify(avaliacoes));
}

function formatarNumero(valor) {
	return Number(valor).toFixed(2);
}

function calcularTotal(notas) {
	const soma = notas.fantasia + notas.harmonia + notas.evolucao + notas.criatividade + notas.samba;
	return soma / 5;
}

function criarConteudoRelatorio(avaliacao) {
	return [
		"RELATÓRIO DE AVALIAÇÃO CULTURAL - CARNAVAL",
		"========================================",
		`ID da avaliação: ${avaliacao.id}`,
		`Data de registro: ${new Date(avaliacao.criadaEm).toLocaleString("pt-BR")}`,
		`Data da apresentação: ${avaliacao.dataApresentacao}`,
		`Grupo: ${avaliacao.grupo}`,
		`Jurado: ${avaliacao.jurado}`,
		"",
		"NOTAS:",
		`- Fantasia: ${formatarNumero(avaliacao.notas.fantasia)}`,
		`- Harmonia: ${formatarNumero(avaliacao.notas.harmonia)}`,
		`- Evolução: ${formatarNumero(avaliacao.notas.evolucao)}`,
		`- Criatividade: ${formatarNumero(avaliacao.notas.criatividade)}`,
		`- Samba/Enredo: ${formatarNumero(avaliacao.notas.samba)}`,
		"",
		`Média final desta apresentação: ${formatarNumero(avaliacao.total)}`,
		"",
		"OBSERVAÇÕES:",
		avaliacao.observacoes || "Sem observações.",
		""
	].join("\n");
}

function baixarRelatorio(avaliacao) {
	const conteudo = criarConteudoRelatorio(avaliacao);
	const blob = new Blob([conteudo], { type: "text/plain;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	const grupoSeguro = avaliacao.grupo.replace(/\s+/g, "_").toLowerCase();
	link.href = url;
	link.download = `relatorio_${grupoSeguro}_${avaliacao.id}.txt`;
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

function renderizarAvaliacoes() {
	const avaliacoes = obterAvaliacoes();

	if (avaliacoes.length === 0) {
		tabelaAvaliacoes.innerHTML = `<tr><td colspan="5" class="empty">Nenhuma avaliação cadastrada.</td></tr>`;
		return;
	}

	tabelaAvaliacoes.innerHTML = avaliacoes
		.map((item) => `
			<tr>
				<td>${item.grupo}</td>
				<td>${item.jurado}</td>
				<td>${item.dataApresentacao}</td>
				<td>${formatarNumero(item.total)}</td>
				<td><button type="button" class="btn-secondary" data-id="${item.id}">Baixar</button></td>
			</tr>
		`)
		.join("");

	document.querySelectorAll("[data-id]").forEach((botao) => {
		botao.addEventListener("click", () => {
			const id = Number(botao.dataset.id);
			const avaliacao = obterAvaliacoes().find((item) => item.id === id);
			if (avaliacao) {
				baixarRelatorio(avaliacao);
			}
		});
	});
}

function renderizarRanking() {
	const avaliacoes = obterAvaliacoes();

	if (avaliacoes.length === 0) {
		tabelaRanking.innerHTML = `<tr><td colspan="4" class="empty">Sem dados para ranking.</td></tr>`;
		vencedorEl.textContent = "Ainda não há avaliações suficientes para definir vencedor.";
		return;
	}

	const acumuladoPorGrupo = avaliacoes.reduce((acc, avaliacao) => {
		if (!acc[avaliacao.grupo]) {
			acc[avaliacao.grupo] = { total: 0, quantidade: 0 };
		}
		acc[avaliacao.grupo].total += avaliacao.total;
		acc[avaliacao.grupo].quantidade += 1;
		return acc;
	}, {});

	const ranking = Object.entries(acumuladoPorGrupo)
		.map(([grupo, dados]) => ({
			grupo,
			quantidade: dados.quantidade,
			media: dados.total / dados.quantidade
		}))
		.sort((a, b) => b.media - a.media);

	tabelaRanking.innerHTML = ranking
		.map((item, indice) => `
			<tr>
				<td>${indice + 1}º</td>
				<td>${item.grupo}</td>
				<td>${item.quantidade}</td>
				<td>${formatarNumero(item.media)}</td>
			</tr>
		`)
		.join("");

	const vencedor = ranking[0];
	vencedorEl.textContent = `Grupo vencedor até o momento: ${vencedor.grupo} (média ${formatarNumero(vencedor.media)}).`;
}

form.addEventListener("submit", (event) => {
	event.preventDefault();

	const novaAvaliacao = {
		id: Date.now(),
		criadaEm: new Date().toISOString(),
		grupo: document.getElementById("grupo").value.trim(),
		jurado: document.getElementById("jurado").value.trim(),
		dataApresentacao: document.getElementById("dataApresentacao").value,
		notas: {
			fantasia: Number(document.getElementById("fantasia").value),
			harmonia: Number(document.getElementById("harmonia").value),
			evolucao: Number(document.getElementById("evolucao").value),
			criatividade: Number(document.getElementById("criatividade").value),
			samba: Number(document.getElementById("samba").value)
		},
		observacoes: document.getElementById("observacoes").value.trim()
	};

	novaAvaliacao.total = calcularTotal(novaAvaliacao.notas);

	const avaliacoes = obterAvaliacoes();
	avaliacoes.push(novaAvaliacao);
	salvarAvaliacoes(avaliacoes);

	form.reset();
	renderizarAvaliacoes();
	renderizarRanking();
});

limparTudoBtn.addEventListener("click", () => {
	const confirmou = window.confirm("Deseja realmente apagar todas as avaliações salvas?");
	if (!confirmou) {
		return;
	}

	localStorage.removeItem(STORAGE_KEY);
	renderizarAvaliacoes();
	renderizarRanking();
});

renderizarAvaliacoes();
renderizarRanking();
