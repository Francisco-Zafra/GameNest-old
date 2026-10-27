# Mesa ilustrada de Exploding Kittens

La interfaz utiliza las reglas y los mensajes de red existentes. No añade Nope, combinaciones de gatos ni otras reglas del juego comercial.

## Interacciones

- La mano se agrupa por tipo (Ataque, Pasar, Ver el futuro, Barajar, Favor, Robo y Desactivar) sin modificar el estado del servidor. Se desplaza horizontalmente y conserva su posición al actualizarse el turno.
- Al robar, solo quien roba ve la carta salir del mazo, girarse, ampliarse y entrar en su grupo de la mano. Puede continuar antes de que termine la pausa automática. Los gatitos explosivos muestran el resultado de la defensa o eliminación. La animación no se repite al entrar o reconectar y respeta el movimiento reducido.
- Tocar una carta abre su efecto; la carta solo se juega tras confirmar.
- Ataque, Favor y Robo muestran los rivales válidos. Los jugadores eliminados o sin cartas no se pueden elegir para robar.
- Desactivar se identifica como protección automática y no se puede malgastar mediante el botón de jugar.
- Robar está disponible tanto en el mazo como en el botón principal. Mientras llega la respuesta se bloquean envíos duplicados.
- Las cartas del futuro se muestran en orden de robo y solo al jugador que las ha visto.
- Los descartes se pueden consultar sin jugarlos. El historial incluye las últimas seis acciones públicas; las cartas robadas a otro jugador solo se detallan a las personas implicadas.
- La mesa conserva los idiomas español, inglés y chino, y respeta la preferencia de movimiento reducido.

## Recursos

- Ilustración: `public/assets/exploding-kittens/card-atlas.png`.
- Estilos: `public/css/exploding-kittens.css`.
- Interfaz: `public/js/renderers/exploding-kittens.js`.
- Orden y detección privada del robo: `public/js/ui/ek-hand-state.js`.
- Textos: `public/js/lang/exploding-kittens.js`.

La ilustración se generó con la herramienta integrada de generación de imágenes, sin imágenes de referencia ni gráficos del juego comercial. Se conserva el PNG generado sin recortes: CSS selecciona cada una de las nueve celdas del atlas. No necesita internet durante la partida.

En el equipo donde se preparó, la copia final del atlas está en `C:\Users\User\Repos\GameNest\public\assets\exploding-kittens\card-atlas.png`.

## Prompt de la ilustración

```text
Create a production game-art SPRITE ATLAS for an original mischievous-cat card game interface. One square image containing an EXACT 3 by 3 grid of equal square cells, NO gutters, NO grid lines, NO labels, NO letters, NO numbers, NO text. Each cell is a separate centered complete illustration with safe padding of 12% on all sides so the character is fully visible inside its own cell. Use one consistent original art direction: expressive angular cartoon cats, chunky charcoal outlines, imperfect screen-printed ink, gouache and cut-paper shapes, playful chaotic humor, boutique illustrated tabletop game, rich colors on warm ivory paper backgrounds. Not photorealistic, not 3D. Functional reading at small mobile size. Each illustration must be original, with no copyrighted existing characters, logos or brand designs. Top left cell: calm teal mechanic cat wearing goggles carefully snipping a sizzling red wire, safety and defusing. Top middle: fierce orange tabby cat launching itself out of a boxing glove, energetic attack, burnt-orange accents. Top right: relaxed blue cat surfing away on a skateboard through a doorway, skip and escape, cobalt accents. Middle left: mysterious purple fortune-teller cat staring into a glass crystal ball containing three small floating stars, future vision. Middle middle: mint cat spinning playing cards in a chaotic whirl around itself, shuffle, emerald accents. Middle right: pink charming cat politely offering an empty gift box with an exaggerated innocent smile, favor, raspberry accents. Bottom left: sneaky dark raccoon-like cat thief in a domino mask hooking a tiny sardine tin with a fishing rod, steal, ochre accents. Bottom middle: surprised black kitten emerging from a dramatic red-orange comic puff with a short lit fuse above its head, harmless comic explosion, no injury. Bottom right: symmetric iconic original black cat face with wide yellow eyes and tiny whiskers inside a red-orange circular sunburst; a striking card-back emblem. Strictly equal 3x3 square cells with their centers at 1/6, 1/2, 5/6 of the width and height. Background of all nine cells is the same light warm ivory paper. Deliver the flat sprite atlas only, no mockup.
```

## Validación

Además de las comprobaciones del proyecto (`npm run check` y `npm test`), se probó una partida con tres navegadores independientes y se verificaron flujos de interacción con estados controlados: confirmación de objetivos, defensa automática, turnos extra, espera, robo obligatorio, eliminación del objetivo, privacidad del futuro, vista previa de una carta robada, eliminación y victoria. Se revisaron anchos de 320, 390, 768 y 1440 píxeles.

Estas pruebas se ejecutaron en Chrome de escritorio emulando tamaños de móvil; el comportamiento táctil y la autonomía finales deben comprobarse en el dispositivo Android.

Para el robo animado se añadieron seis pruebas unitarias de agrupación, detección privada y reconexión. Se verificaron además el giro y la llegada automática a la mano, continuar/Escape, el bloqueo de acciones durante el robo, la privacidad con tres clientes reales, desactivación y eliminación, limpieza al reiniciar o perder la carta, y movimiento reducido. Resultado del proyecto: 385 pruebas aprobadas y 2 omitidas; comprobación de sintaxis de 192 archivos JavaScript.
