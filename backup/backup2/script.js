const fetchDataButton = document.getElementById('fetch-data');
const loading = document.getElementById('loading');
const historicoTableBody = document.querySelector('#historico tbody');
const toggleHistoricoButton = document.getElementById('toggle-historico');
const historicoContainer = document.getElementById('historico-container');
const selectPeriodo = document.getElementById('select-periodo');
let historico = [];

fetchDataButton.addEventListener('click', function () {
    const periodoSelecionado = parseInt(selectPeriodo.value);
    fetchAndCalculate(periodoSelecionado);
});

toggleHistoricoButton.addEventListener('click', function () {
    historicoContainer.classList.toggle('hidden');
    toggleHistoricoButton.textContent = historicoContainer.classList.contains('hidden') ? 'Mostrar Histórico' : 'Ocultar Histórico';
});

selectPeriodo.addEventListener('change', function () {
    const periodoSelecionado = parseInt(selectPeriodo.value);
    fetchAndCalculate(periodoSelecionado);
});

function fetchAndCalculate(periodo = 1) {
    loading.style.display = 'flex';
    axios.get('https://droidsolutions.com.br/loteria/api/')
        .then(response => {
            historico = response.data.reverse().map(item => ({
                date: item.date,
                hora: item.hora,
                number_1: item.number_1,
                number_2: item.number_2,
                number_3: item.number_3,
                number_4: item.number_4,
                number_5: item.number_5
            }));
            atualizarHistorico(periodo);
            calcularProbabilidadesPorPeriodo(periodo);
        
        })
        .catch(error => {
            console.error('Erro ao buscar dados:', error);
            alert('Erro ao buscar dados da API. Por favor, tente novamente mais tarde.');
        })
        .finally(() => {
            loading.style.display = 'none';
        });
}

function atualizarHistorico(periodo) {
    historicoTableBody.innerHTML = '';
    let historicoFiltrado = [];

    if (periodo === 0) {
        historicoFiltrado = historico;
    } else {
        const agora = new Date();
        const limiteInferior = new Date(agora.getTime() - periodo * 60 * 60 * 1000);
        historicoFiltrado = historico.filter(sorteio => new Date(sorteio.date + ' ' + sorteio.hora) >= limiteInferior);
    }

    historicoFiltrado.forEach((sorteio, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${sorteio.hora}</td>
            <td>${sorteio.number_1}</td>
            <td>${sorteio.number_2}</td>
            <td>${sorteio.number_3}</td>
            <td>${sorteio.number_4}</td>
            <td>${sorteio.number_5}</td>
        `;
        historicoTableBody.appendChild(row);
    });
}

function calcularProbabilidadesPorPeriodo(periodo) {
    if (historico.length === 0) {
        return;
    }

    let historicoFiltrado = [];

    if (periodo === 0) {
        historicoFiltrado = historico;
    } else {
        const agora = new Date();
        const limiteInferior = new Date(agora.getTime() - periodo * 60 * 60 * 1000);
        historicoFiltrado = historico.filter(sorteio => new Date(sorteio.date + ' ' + sorteio.hora) >= limiteInferior);
    }

    const contagem = {
        bola1: { par: 0, impar: 0 },
        bola2: { par: 0, impar: 0 },
        bola3: { par: 0, impar: 0 },
        bola4: { par: 0, impar: 0 },
        bola5: { par: 0, impar: 0 }
    };

    historicoFiltrado.forEach(sorteio => {
        for (let i = 1; i <= 5; i++) {
            const bola = sorteio[`number_${i}`];
            if (bola % 2 === 0) {
                contagem[`bola${i}`].par++;
            } else {
                contagem[`bola${i}`].impar++;
            }
        }
    });

    for (let i = 1; i <= 5; i++) {
        const total = historicoFiltrado.length;
        
        if (total > 0) {
            const probPar = (contagem[`bola${i}`].par / total) * 100;
            const probImpar = (contagem[`bola${i}`].impar / total) * 100;

            const palpiteElement = document.getElementById(`palpite-bola${i}`);
            const resultadoElement = document.getElementById(`resultado-bola${i}`);
            const probabilidadeElement = document.getElementById(`probabilidade-bola${i}`);

            if (probPar > probImpar) {
                palpiteElement.textContent = 'Par';
                resultadoElement.textContent = 'Par';
                probabilidadeElement.textContent = `${probPar.toFixed(2)}%`;
            } else {
                palpiteElement.textContent = 'Ímpar';
                resultadoElement.textContent = 'Ímpar';
                probabilidadeElement.textContent = `${probImpar.toFixed(2)}%`;
            }
        } else {
            const palpiteElement= document.getElementById(`resultado-bola${i}`);
            const resultadoElement = document.getElementById(`resultado-bola${i}`);
            const probabilidadeElement = document.getElementById(`probabilidade-bola${i}`);

            palpiteElement.textContent = '-';
            resultadoElement.textContent = '-';
            probabilidadeElement.textContent = '-';
        }
    }
}

fetchAndCalculate(); // Chama a função ao carregar a página para exibir os dados iniciais