# Schotten Totten clásico

Juego para dos personas, sin cartas tácticas. Se puede jugar por la red local o completar la sala con un bot. No requiere nuevas dependencias ni acceso a internet durante la partida. El anfitrión empieza.

## Reglas implementadas

Se reparten seis cartas por persona del mazo de 54. En cada turno se coloca una carta junto a una de las nueve piedras. Después se pueden reclamar piedras y se repone la mano. La clasificación es escalera de color, trío, color, escalera y suma; después se compara el total y, en empate exacto, quién completó primero. Se gana con tres piedras contiguas o cinco en total.

La reclamación anticipada enumera las posibles formaciones rivales con las cartas que no se han jugado públicamente. Incluye las cartas de ambas manos como posibilidades: una carta privada no sirve de prueba. La decisión de reclamar es manual. Cuando no hay reclamaciones posibles, se repone la carta y se avanza automáticamente. Si el mazo se agota, se continúa sin robar; si no se puede colocar ninguna carta, aparece Pasar.

Referencia: reglamento de IELLO de 2016, páginas 4–10, [PDF](https://cdn.1j1ju.com/medias/d5/72/2f-schotten-totten-rulebook.pdf). Esta implementación no usa ilustraciones ni logotipos del producto comercial.

## Interfaz móvil

- Las seis cartas permanecen visibles en un soporte inferior; se pueden ordenar por clan o valor.
- Una colocación exige elegir carta y piedra y confirmar. Tocar una carta no envía una jugada.
- El tablero se desplaza horizontalmente y un resumen de nueve botones muestra la propiedad de toda la frontera.
- Cada clan tiene color, símbolo y animal propios. El número mantiene alto contraste.
- Ver esta piedra amplía ambas formaciones, sus sumas y el motivo de la reclamación.
- Antes de reponer la mano, se puede reclamar más de una piedra o terminar sin reclamar.
- Los controles respetan el movimiento reducido. En pantallas bajas, la mano entra en el flujo de la página para poder consultar todo mediante desplazamiento vertical.

El servidor oculta la mano contraria y el orden del mazo. Al reconectar se restaura la fase de turno; si vence el plazo de reconexión y se salta el asiento ausente, se repone solo su carta pendiente y se descartan sus reclamaciones opcionales de ese turno.

## Código y recursos

- Motor y verificación de reclamaciones: `games/schotten-totten.js`.
- Bot sin información privada rival: `bots/schotten-totten.js`.
- Interfaz y estilos: `public/js/renderers/schotten-totten.js`, `public/css/schotten-totten.css`.
- Textos y ayuda en español, inglés y chino: `public/js/lang/schotten-totten.js`.
- Atlas de nueve celdas: `public/assets/schotten-totten/clan-atlas.png`.
- Portada del catálogo: `public/assets/schotten-totten/cover.png`.

Ambas imágenes se generaron con la herramienta integrada de generación de imágenes, sin referencias externas. Se conservan los PNG completos; CSS selecciona las celdas del atlas, sin recortes de archivo.

### Especificación de las ilustraciones

Atlas: cuadrícula cuadrada exacta de 3 × 3, sin texto ni números, ilustración original de animales guardianes de las Highlands con bufandas de tartán, gouache y tinta sobre papel marfil. Fila superior: zorro rojo, nutria azul y ciervo verde. Fila central: tejón amarillo, búho violeta y liebre rosa. Fila inferior: piedra fronteriza con musgo, paisaje de las Highlands y escudo con cardo y nudos. Contorno claro para lectura a tamaño pequeño; sin personajes de juegos existentes.

Portada: ilustración horizontal original, zorro con tartán rojo y nutria con tartán azul enfrentados de forma amistosa a través de una frontera de piedras; montañas, brezo y luz dorada, sin texto, logotipos ni números. Se conserva la salida generada como `cover.png`.

## Validación

Pruebas del motor: reparto, 54 cartas únicas, cinco formaciones, desempates, todas las restricciones de colocación, ventana de reclamación, pruebas públicas, reclamaciones múltiples, ambas victorias, mazo vacío, pasar, privacidad, abandono del turno y partidas completas de bots.

Pruebas de navegador: dos clientes reales, turnos sincronizados, cartas privadas, seis cartas visibles en móvil, tablero y resumen, confirmación, errores y reintentos, ayuda, inspección y Escape, reconexión, partida completa, victoria y reinicio. Estados controlados prueban las reclamaciones anticipadas y la victoria de tres piedras seguidas. Se revisaron anchos de 320, 390, 768 y 1440 píxeles, además de una pantalla horizontal de 700 × 400 y movimiento reducido.

La comprobación visual se realizó en Chrome de escritorio emulando tamaños de móvil. La prueba final del tacto y del espacio disponible con las barras del navegador corresponde al dispositivo Android.
