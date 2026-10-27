(function() {
  var entries = {
    tictactoe: ['Tres en raya', 'Tres fichas en línea', 'Una partida rápida para dos, perfecta para empezar.', 'Tablero', ['Rápido', 'Para empezar']],
    gomoku: ['Gomoku', 'Cinco en raya en un tablero de 15 × 15', 'Coloca tus fichas y prepara una línea de cinco antes que tu rival.', 'Tablero', ['Estrategia', 'Duelo']],
    davinci: ['Código Da Vinci', 'Deduce los números ocultos', 'Adivina los números de las fichas de tus rivales a partir de sus colores y posiciones.', 'Cartas y fichas', ['Deducción', 'Faroles']],
    uno: ['UNO', 'Colores, cambios de sentido y una última carta', 'Combina colores o números y sé el primero en quedarte sin cartas.', 'Fiesta', ['Clásico', 'En grupo']],
    doudizhu: ['Dou Dizhu', 'Un terrateniente contra los campesinos', 'Juego de cartas de bazas por combinaciones. Puedes completar la mesa con bots.', 'Cartas y fichas', ['Clásico', 'Tres jugadores']],
    'exploding-kittens': ['Exploding Kittens', 'Roba, desactiva y sobrevive', 'Evita los gatos explosivos y usa tus cartas para seguir en la partida.', 'Fiesta', ['Azar', 'Sorpresas']],
    rummikub: ['Rummikub', 'Grupos, escaleras y buenas combinaciones', 'Organiza las fichas en grupos y escaleras para vaciar tu soporte.', 'Cartas y fichas', ['Combinaciones', 'Rejugable']],
    sudoku: ['Sudoku', 'El mismo reto para todos', 'Completad el mismo sudoku y descubrid quién termina antes.', 'Ingenio', ['Lógica', 'Competición']],
    '2048': ['2048', 'Desliza, combina y llega a 2048', 'Partís del mismo tablero. Combina números para alcanzar 2048 antes que los demás.', 'Ingenio', ['Números', 'Competición']],
    twentyfour: ['El juego del 24', 'Cuatro números y un objetivo', 'Combina los números con operaciones para conseguir 24 antes que los demás.', 'Ingenio', ['Cálculo', 'En grupo']],
    minesweeper: ['Carrera de Buscaminas', 'Mismo campo, gana quien lo despeje antes', 'Buscad las minas en tableros idénticos. Un error te deja fuera.', 'Ingenio', ['Rapidez', 'Observación']],
    numberbomb: ['Número bomba', 'Acota el intervalo y evita la bomba', 'Cada número reduce el intervalo. Pierde quien encuentre el número oculto.', 'Fiesta', ['En grupo', 'Adivinanzas']],
    oldmaid: ['La mona', 'Forma parejas y evita la carta sin pareja', 'Un juego de cartas sencillo para pasar un buen rato con amigos.', 'Fiesta', ['Sencillo', 'En grupo']],
    liarsbar: ['El bar de los mentirosos', 'Miente, acusa y sobrevive', 'Juega tus cartas y decide cuándo creer a los demás y cuándo descubrir su farol.', 'Cartas y fichas', ['Psicología', 'Faroles']],
    bigtwo: ['Big Two', 'Supera la jugada y vacía tu mano', 'Un juego tradicional de cartas en el que cada combinación debe superar la anterior.', 'Cartas y fichas', ['Combinaciones', 'Tradicional']],
    'mahjong-sichuan': ['Mahjong', 'Modalidades de Sichuan y cantonesa', 'Completa combinaciones de fichas y elige las reglas de la mesa.', 'Cartas y fichas', ['Mahjong', 'Estrategia']],
    texas: ['Texas Hold’em', 'Apuesta, interpreta y sorprende', 'Una mesa de póquer con fichas para disfrutar en grupo.', 'Cartas y fichas', ['Apuestas con fichas', 'Faroles']],
    flightchess: ['Carrera de aviones', 'Lanza el dado y lleva tus aviones a casa', 'Una carrera de tablero para disfrutar en familia.', 'Fiesta', ['Familia', 'Sencillo']],
    snakebattle: ['Batalla de serpientes', 'Sobrevive en la arena sin chocar', 'Mueve tu serpiente en tiempo real y supera a tus rivales.', 'En directo', ['Arcade', 'Rápido']],
    chinesechess: ['Ajedrez chino', 'Un duelo de estrategia tradicional', 'Planea tus movimientos y protege a tu general en este clásico de tablero.', 'Tablero', ['Estrategia', 'Tradicional']],
    chess: ['Ajedrez', 'El duelo clásico', 'Ajedrez para dos con enroque y captura al paso.', 'Tablero', ['Estrategia', 'Clásico']],
    checkers: ['Damas', 'Capturas obligatorias y coronaciones', 'Damas en un tablero de 8 × 8, con capturas múltiples.', 'Tablero', ['Clásico', 'Sencillo']],
    connect4: ['Cuatro en raya', 'Deja caer fichas y conecta cuatro', 'Un tablero de 7 × 6 para un duelo que entiende toda la familia.', 'Tablero', ['Familia', 'Rápido']],
    reversi: ['Reversi', 'Voltea las fichas y conquista el tablero', 'Termina con más fichas que tu rival. Las esquinas pueden decidir la partida.', 'Tablero', ['Estrategia', 'Remontadas']],
    go9: ['Go 9 × 9', 'Territorio y estrategia en formato corto', 'Una versión de Go en tablero de 9 × 9 para partidas más rápidas.', 'Tablero', ['Territorio', 'Partidas cortas']],
    monopoly: ['Monopoly', 'Compra, construye y cobra alquileres', 'Consigue propiedades y construye casas para llevar a tus rivales a la bancarrota.', 'Fiesta', ['Economía', 'Sorpresas']],
    suikabattle: ['Batalla de frutas', 'Deja caer, combina y hazlas crecer', 'Combina frutas iguales y compite por conseguir las más grandes.', 'En directo', ['Física', 'Combinar']],
    sheeptile: ['Tríos de fichas', 'Combina tres y despeja la pila', 'Encuentra grupos de tres entre las capas de fichas y termina antes que tus rivales.', 'Ingenio', ['Parejas y tríos', 'Capas']],
    drawguess: ['Dibuja y adivina', 'Dibuja, pasa y ríete', 'Dibuja y adivina en directo o juega al teléfono escacharrado con dibujos.', 'Fiesta', ['En grupo', 'Risas']],
    battleship: ['Hundir la flota', 'Despliega tus barcos y encuentra los de tu rival', 'Oculta tu flota en un tablero de 10 × 10 y trata de hundir la contraria.', 'Tablero', ['Estrategia', 'Duelo']],
    hearts: ['Corazones', 'Evita los puntos o ve a por todos', 'Juego de bazas para cuatro: cada corazón suma un punto y la reina de picas, trece.', 'Cartas y fichas', ['Bazas', 'Estrategia']],
    truthdare: ['Verdad o reto', 'Una carta para romper el hielo', 'Elige entre preguntas y retos de varios mazos, o añade los tuyos.', 'Fiesta', ['En grupo', 'Sencillo']],
    sanguo: ['Duelo de los Tres Reinos', 'Señor, leales, rebeldes y un espía', 'Juego de cartas con identidades ocultas para 4 a 8 personas y generales con habilidades propias.', 'Cartas y fichas', ['Roles ocultos', 'Cartas', 'Estrategia']],
    werewolf: ['Hombres lobo', 'Tu móvil dirige la partida', 'Para 6 a 12 personas. La vidente, la bruja y otros personajes actúan y votan desde su móvil.', 'Fiesta', ['Roles ocultos', 'Deducción']]
  };
  var source = window.__LANG.en.catalog;
  var catalog = {};
  Object.keys(entries).forEach(function(id) {
    var entry = entries[id];
    var original = source[id] || {};
    catalog[id] = {
      name: entry[0], subtitle: entry[1], description: entry[2],
      players: String(original.players || '').replace(/players/i, 'jugadores'),
      duration: original.duration || '', category: entry[3], tags: entry[4]
    };
  });
  window.__LANG.es.catalog = catalog;
})();
