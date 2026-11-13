# Esquadrão Tático

FPS tático 5×5 em 3D feito com HTML, CSS e JavaScript (Three.js r128), que roda direto no navegador, no computador ou no celular.
Mapas, agentes, armas, facas e acabamentos são **originais**. O jogo é inspirado no gênero dos shooters táticos de desarme de bomba.

## Como jogar

- **Jogar agora:** abra o `index.html` por um servidor local (por exemplo, `python -m http.server`) ou use o link do GitHub Pages do repositório.
- **Teclado e mouse:** WASD movimenta, Espaço pula, Ctrl agacha, Shift anda, R recarrega, E usa (portas, janelas, pegar arma, plantar e desarmar), B abre a loja, F inspeciona, G larga a arma, Tab mostra o placar e 1 a 6 trocam de arma.
- **Celular:** analógico à esquerda, arraste à direita para mirar, e os botões ficam na tela (gire na horizontal).

## O que tem

- **Mapas:** 14 mapas, cada um com construções do tema (Usina Nuclear com o reator numa piscina letal, Ruínas Esquecidas, Galerias do Esgoto, Vila das Pontes, ferrovia, fundição com metal fundido, porto com guindaste…), escadas, telhados, casas e fábricas onde dá para entrar, janelas de vidro que quebram ou abrem (fazendo barulho), escadas de mão, portas que estilhaçam a tiro ou explodem com granada, móveis, máquinas e a Usina Nuclear (reator, torres de refrigeração e sala de bombas).
- **Lugares altos e passagens:** torres de vigia (escada de mão) e bases de concreto (degraus) em todos os mapas, dutos/bueiros que dá para atravessar, tubulações enterráveis através das paredes e, na Usina, o bombsite A num convés de aço **sobre** o salão do reator (B), com escada ligando os dois.
- **Caixas e barris com a cara de cada mapa** (concreto na usina, pedra no templo, contêiner no porto…).
- **Fumaça:** tiros abrem um túnel largo por ~5 s e a granada HE varre a fumaça por ~10 s; depois ela volta devagar.
- **Munição por carregador:** a reserva é uma lista de pentes; ao recarregar o pente velho é descartado com as balas que sobraram. O HUD mostra os pentes e tudo é reabastecido a cada rodada.
- **Som de tiro realista:** estalo, corpo, pancada grave e eco, com timbre próprio por arma, atraso e abafamento pela distância.
- **Guindastes do porto** com escada e passarela no alto; mais casas e fábricas com porta aberta na parede e janelas que abrem e quebram.
- **Agentes e armas:** 42 agentes, 45 armas com padrão de recuo e penetração, 14 estilos de faca (karambit, borboleta, baionetas, bowie, canivete, tantō, kukri e outros) e 40 acabamentos no Arsenal.
- **Bots:** com dificuldade ajustável, que usam portas e escadas de mão.
- **Servidor público por mapa (modo padrão):** o botão JOGAR leva à tela de entrada do mapa escolhido. Todos que escolhem o mesmo mapa caem na mesma partida (sem criar sala nem código, ninguém é admin). Com 2 ou mais jogadores a partida começa em 10 s, ou em 20 s se estiver sozinho, e os bots completam o 5 contra 5. Quem chega com a partida em andamento entra no lugar de um bot pelo botão ENTRAR NA PARTIDA. O navegador do primeiro jogador roda a simulação; se ele sair, os outros procuram uma nova partida sozinhos. TREINO OFFLINE (só bots) e SALA PRIVADA (com código) continuam no menu.
- **Online:** sala com código de 5 letras, de navegador para navegador (PeerJS), com bots completando os times. Se a conexão direta não fecha (redes com NAT restritivo, como dados móveis), cai sozinha numa retransmissão por MQTT.
- **Animações:** sacar e recarregar de armas, facas e granadas (carregador cai e sobe, pino da granada, arremesso).
- **Anti-trapaça Guardião:** decide só pelo que acontece na partida (mira, tiros, movimento e estado do personagem).
- **Painel "Invicto":** só offline, para testar o Guardião.
