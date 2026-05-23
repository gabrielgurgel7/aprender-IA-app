const form = document.querySelector("#hero__form");
const input = document.querySelector("#hero__input");
const btnForm = document.querySelector("#hero__button");
const outputEl = document.querySelector("#resposta");
const btnDownload = document.querySelector("#btn-download");
const conteudoSection = document.querySelector("#conteudo-section");
let temaAtual = "";

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = input.value.trim();
  if (!query) {
    alert("O campo está vazio. Tente novamente.");
    return;
  }

  try {
    temaAtual = query;
    btnForm.disabled = true;
    btnForm.textContent = "Analisando...";
    btnForm.classList.remove("clicavel");
    btnForm.classList.add("cursor-bloqueado");

    outputEl.innerHTML = "<p>🔍 Pesquisando fontes sobre o tema...</p>";
    conteudoSection.classList.remove("hidden");
    conteudoSection.scrollIntoView({ behavior: "smooth", block: "start" });

    // 1. Envia o tema e recebe o ID
    const res = await fetch("https://proxy-n8n.gabrielgurgel635.workers.dev", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();
    const id = data.id;

    // 2. Inicia o polling
    await polling(id);
  } catch (error) {
    alert("Erro ao enviar.");
  } finally {
    btnForm.disabled = false;
    btnForm.textContent = "Pesquisar";
    btnForm.classList.remove("cursor-bloqueado");
    btnForm.classList.add("clicavel");
    form.reset();
  }
});

async function polling(id) {
  const mensagens = [
    "🔍 Pesquisando fontes sobre o tema...",
    "✅ Verificando confiabilidade das fontes...",
    "✍️ Redigindo seu material...",
    "📚 Finalizando o conteúdo...",
  ];
  let mensagemIndex = 0;
  const intervalo = 5000;
  const maxTentativas = 60;

  for (let i = 0; i < maxTentativas; i++) {
    await esperar(intervalo);

    // Atualiza mensagem progressivamente
    if (i % 4 === 0 && mensagemIndex < mensagens.length - 1) {
      mensagemIndex++;
    }
    outputEl.innerHTML = `<p>${mensagens[mensagemIndex]}</p>`;

    const res = await fetch(
      "https://proxy-n8n.gabrielgurgel635.workers.dev/status",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      },
    );

    const data = await res.json();

    console.log("POLLING RESPONSE:", JSON.stringify(data));

    if (data.status === "done") {
      let conteudo = data.conteudo;
      if (typeof conteudo === "string") {
        conteudo = conteudo
          .replace(/^"|"$/g, "")
          .replace(/\\n/g, "")
          .replace(/\\"/g, '"');
      }
      outputEl.innerHTML = conteudo;
      return;
    }
  }

  outputEl.innerHTML = "<p>⏱️ Tempo limite atingido. Tente novamente.</p>";
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

btnDownload.addEventListener("click", () => {
  window.print();
});
