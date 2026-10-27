# Español en la versión personal

Esta rama añade español como tercer idioma, conservando inglés y chino.

## Qué está traducido

- Catálogo de los 34 juegos actuales: títulos, descripciones, categorías y etiquetas.
- Navegación, búsqueda, creación de salas, asientos, botones y estados compartidos.
- Ajustes comunes y mensajes de error generales del servidor.
- UNO: interfaz, colores, avisos, errores y reglas de esta implementación.

El selector de idioma está en el catálogo y en la cabecera de las salas. La elección se guarda en el navegador. Si no hay una elección guardada, los navegadores configurados en español lo seleccionan automáticamente.

La traducción específica de los demás juegos y de sus reglas todavía está pendiente. Las claves pendientes del sistema de traducciones usan el texto inglés como respaldo. Los bancos de palabras de dibujo y las cartas de Verdad o reto también conservan contenido en inglés; se pueden introducir palabras, preguntas y retos propios desde los ajustes de la sala.

## Probar y ejecutar

```sh
npm ci --ignore-scripts --no-audit --no-fund
npm run check
npm test
npm start
```

Abre `http://127.0.0.1:3000` en el dispositivo servidor. Los demás jugadores deben entrar mediante la dirección del servidor en la red wifi o punto de acceso, con el mismo puerto.

## Actualizaciones

- `origin` apunta al fork `Francisco-Zafra/GameNest`.
- `upstream` apunta al proyecto original `absswds/GameNest`.
- La rama `master` conserva la base original; `personal` contiene esta versión.
- Combina las actualizaciones de `upstream/master` en el ordenador y comprueba la interfaz y las partidas antes de subirlas a `personal`.
- En el móvil, detén el servidor antes de actualizar. En una copia ya configurada para seguir `origin/personal`, usa `git pull --ff-only`. Si cambia el archivo de dependencias, vuelve a ejecutar `npm ci` antes de arrancar.

Las partidas están en memoria: reiniciar el servidor termina las salas activas.
