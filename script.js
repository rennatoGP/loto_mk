const fetchDataButton = document.getElementById('fetch-data');
const loading = document.getElementById('loading');
const historicoTableBody = document.querySelector('#historico tbody');
const toggleHistoricoButton = document.getElementById('btn-toggle-historico');
const historicoContainer = document.getElementById('historico-container');
const selectPeriodo = document.getElementById('select-periodo');
const horaPalpiteElement = document.querySelector('.hora-palpite');
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
        
            // Calcula o horário do próximo sorteio
            if (historico.length > 0) {
                const ultimoSorteio = historico[0];
                const dataHoraUltimoSorteio = new Date(`${ultimoSorteio.date} ${ultimoSorteio.hora}`);
                const dataHoraProximoSorteio = new Date(dataHoraUltimoSorteio.getTime() + 3 * 60 * 1000);

                const horas = String(dataHoraProximoSorteio.getHours()).padStart(2, '0');
                const minutos = String(dataHoraProximoSorteio.getMinutes()).padStart(2, '0');
                horaPalpiteElement.textContent = `${horas}:${minutos}`;
            } else {
                horaPalpiteElement.textContent = '-';
            }
        
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

    const agora = new Date();

    if (periodo === 0) {
        historicoFiltrado = historico;
    } else {
        const limiteInferior = new Date(agora.getTime() - periodo * 60 * 60 * 1000);
        historicoFiltrado = historico.filter(sorteio => {
            const dataHora = new Date(sorteio.date + ' ' + sorteio.hora);
            return dataHora >= limiteInferior && dataHora <= agora;
        });
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
    
    const agora = new Date();

    if (periodo === 0) {
        historicoFiltrado = historico;
    } else {
        const inicioDoPeriodo = new Date(agora.getTime() - periodo * 60 * 60 * 1000);

        historicoFiltrado = historico.filter(sorteio => {
            const dataHora = new Date(sorteio.date + ' ' + sorteio.hora);
            return dataHora >= inicioDoPeriodo && dataHora <= agora;
        });
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
            const bola = parseInt(sorteio[`number_${i}`], 10);
            if (bola % 2 === 0) {
                contagem[`bola${i}`].par++;
            } else {
                contagem[`bola${i}`].impar++;
            }
        }
    });

    let probabilidades = [];

    for (let i = 1; i <= 5; i++) {
        const parCount = contagem[`bola${i}`].par;
        const imparCount = contagem[`bola${i}`].impar;

        const palpiteElement = document.getElementById(`palpite-bola${i}`);

        if (parCount > imparCount) {
            palpiteElement.innerHTML = `<span>${i}º</span><span>Par</span>`;
            probabilidades.push({ bola: i, tipo: 'Par', contagem: parCount });
        } else if (imparCount > parCount) {
            palpiteElement.innerHTML = `<span>${i}º</span><span>Ímpar</span>`;
            probabilidades.push({ bola: i, tipo: 'Ímpar', contagem: imparCount });
        } else {
            palpiteElement.innerHTML = `<span>${i}º</span><span>Empate</span>`;
            probabilidades.push({ bola: i, tipo: 'Empate', contagem: 0 });
        }
    }

    // Ordena os palpites pelos maiores contadores e pega os dois melhores
    probabilidades.sort((a, b) => b.contagem - a.contagem);
    const melhoresPalpites = probabilidades.slice(0, 2);

    // Atualiza os elementos com os melhores palpites
    if (melhoresPalpites.length > 0) {
        const melhorPalpiteElement1 = document.getElementById('palpite-melhor-bola1');
        const melhorPalpiteElement2 = document.getElementById('palpite-melhor-bola2');

        melhorPalpiteElement1.innerHTML = `<span>${melhoresPalpites[0].bola}º</span><span>${melhoresPalpites[0].tipo}</span>`;
        if (melhoresPalpites.length > 1) {
            melhorPalpiteElement2.innerHTML = `<span>${melhoresPalpites[1].bola}º</span><span>${melhoresPalpites[1].tipo}</span>`;
        }
    }
}


fetchAndCalculate(); // Chama a função ao carregar a página para exibir os dados iniciais
