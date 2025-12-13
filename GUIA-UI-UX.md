# Guía de UI/UX para Sistema POS

Esta guía define la colorimetría, componentes, tipografía, espaciado, patrones responsivos y reglas de accesibilidad para lograr una interfaz profesional, clara e intuitiva. Se inspira en las referencias visuales incluidas en `IMG-EJEMPLOS`.

## Paleta de Colores

- Primario: `#3880ff` (consistente con `theme_color` del PWA)
- Secundario: `#3dc2ff`
- Énfasis/Terciario: `#5260ff`
- Éxito: `#2dd36f`
- Advertencia: `#ffc409`
- Peligro/Error: `#eb445a`
- Info: `#3dc2ff`
- Neutros:
  - Texto principal: `#222428`
  - Texto secundario: `#92949c`
  - Bordes/Divisores: `#e0e0e0`
  - Fondo claro: `#f4f5f8`
  - Fondo oscuro: `#1e1e1e`

### Uso

- Primario: botones principales, enlaces activos, destacados del flujo (ej. acción de "Cobrar").
- Secundario: acciones secundarias, resaltados informativos.
- Éxito/Advertencia/Error: estados de validación, badges y feedback.
- Neutros: fondos, superficies, tipografía y separadores.

## Tipografía

- Familia: `System UI` (preferente), con fallback `Roboto`, `Segoe UI`, `Inter`.
- Jerarquía y tamaños (móvil → desktop):
  - Título sección: `24px` → `28px` (`font-weight: 600`)
  - Subtítulo: `18px` → `20px` (`font-weight: 500`)
  - Texto: `16px` → `16px` (`line-height: 1.5`)
  - Auxiliar/Notas: `14px` → `14px`
- Contraste: ratio mínimo 4.5:1 entre texto y fondo.

## Espaciado y Grid

- Escala espacial (CSS variables): `4, 8, 12, 16, 24, 32, 40` px.
- Reglas:
  - Separación entre campos de formularios: `8–12px`.
  - Margen de secciones: `24–32px`.
  - Contenedor central en pantallas de autenticación: ancho máximo `420px` (móvil y desktop), centrado.
- Grid responsive:
  - Móvil: 1 columna.
  - Tablet: 2 columnas.
  - Desktop: 12 columnas con gutters de `16px`.

## Breakpoints

- `sm`: `576px`
- `md`: `768px`
- `lg`: `992px`
- `xl`: `1200px`

Aplicación práctica:
- Login y formularios críticos: conservar `max-width: 420px` y centrado.
- Tablas (inventario, usuarios): usar scroll horizontal en móvil y densidad compacta en desktop.

## Componentes

- Botones (`ion-button`):
  - Primario para acciones principales; Secundario para alternativas.
  - `expand="block"` en móvil para facilitar toque.
  - Estados: `default`, `hover`, `active`, `disabled`, `loading` (spinner).
- Inputs (`ion-item` + `ion-input`/`ion-select`):
  - `position="floating"` para etiquetas.
  - Validación inline: mensajes concisos (`14px`, color `Error`).
  - Iconos auxiliares solo cuando aporten valor (mostrar/ocultar password, búsqueda).
- Cards y paneles: superficies con `background: #fff` y bordes `#e0e0e0`.
- Badges: usar colores de estado; evitar sobresaturación.
- Listas y tablas:
  - Móvil: lista comprimida con acciones en swipe o botón contextual.
  - Desktop: tabla con columnas reordenables y filtros visibles.

## Estados y Feedback

- Errores: mensaje claro, color de `Error`, contexto del campo.
- Éxito: confirmación breve y no intrusiva; usar toast.
- Advertencias: prevenir acciones destructivas con `alert` de confirmación.
- Offline: banner persistente no bloqueante en la parte superior/inferior.

## Accesibilidad

- Roles y `aria-*` en formularios y componentes interactivos.
- Enfoque visible: `outline` accesible en botones y campos.
- Navegación por teclado: orden lógico (`tabindex` natural).
- Texto alternativo en imágenes y etiquetas asociadas a inputs.

## Iconografía

- Ionicons por defecto; grosor y tamaño consistentes (`16–20px`).
- Color acorde al estado; evitar iconos de colores múltiples salvo en branding.

## Nomenclatura y Organización CSS

- CSS variables globales para tokens (colores, espaciado, sombra, radios): `:root { … }`.
- Utilizar clases de utilidad moderadas (`.mt-16`, `.grid-2`) y estilos por componente (`.page-x .element-y`).
- Evitar reglas profundamente anidadas; mantener especificidad baja.

## Mapeo de Tokens a Ionic

Definir variables del tema en `frontend-app/src/theme/variables.scss` y reutilizarlas en componentes:

```scss
:root {
  /* Colores */
  --ion-color-primary: #3880ff;
  --ion-color-secondary: #3dc2ff;
  --ion-color-tertiary: #5260ff;
  --ion-color-success: #2dd36f;
  --ion-color-warning: #ffc409;
  --ion-color-danger: #eb445a;
  --ion-color-dark: #222428;
  --ion-color-medium: #92949c;
  --ion-color-light: #f4f5f8;

  /* Espaciado */
  --space-4: 4px; --space-8: 8px; --space-12: 12px;
  --space-16: 16px; --space-24: 24px; --space-32: 32px; --space-40: 40px;

  /* Sombra y radios */
  --shadow-1: 0 1px 3px rgba(0,0,0,.08);
  --radius-8: 8px;
}

/* Ejemplo de formulario de login */
.login-wrapper {
  display: flex; align-items: center; justify-content: center; min-height: 100%;
}
.container { width: 100%; max-width: 420px; padding: var(--space-16); }
.title { font-size: 24px; margin-bottom: var(--space-16); }
.input-item { margin-bottom: var(--space-8); }
.error { color: var(--ion-color-danger); font-size: 14px; margin: 4px 8px 12px; }
.actions { display: flex; flex-direction: column; gap: var(--space-12); }
.forgot { text-align: center; text-decoration: none; }

@media (min-width: 768px) {
  .title { font-size: 28px; }
}
```

## Patrones Responsivos Clave

- Autenticación (login):
  - Contenedor centrado con `max-width: 420px`.
  - Botón primario ocupa ancho completo en móvil; en desktop puede reducirse.
- Dashboard (desktop):
  - Tarjetas con gráficos y KPIs en rejilla 12 columnas; evitar barras laterales densas.
- Flujo de caja (móvil):
  - Lista vertical con totales fijados al pie; acceso rápido a filtros.
- POS (desktop):
  - Panel productos a la izquierda; ticket a la derecha; área de acciones en el pie.

## Referencias Visuales (IMG-EJEMPLOS)

- Login móvil: `IMG-EJEMPLOS/smartpos_mobile_login.webp`
- Flujo de caja móvil: `IMG-EJEMPLOS/smartpos_mobile_cash_flow.webp`
- Inventario móvil: `IMG-EJEMPLOS/smartpos_mobile_inventory_list.webp`
- Dashboard PC: `IMG-EJEMPLOS/smartpos_pc_dashboard_charts.webp`
- Inventario PC: `IMG-EJEMPLOS/smartpos_pc_inventory_table.webp`
- Pantalla POS: `IMG-EJEMPLOS/smartpos_pc_pos_screen.webp`
- Gestión de usuarios: `IMG-EJEMPLOS/smartpos_pc_user_management.webp`

## Buenas Prácticas

- Consistencia ante todo: los mismos patrones en todas las pantallas.
- Reducción de fricción: menos pasos para acciones frecuentes.
- Claridad: textos concretos, acciones visibles y feedback inmediato.
- Rendimiento percibido: lazy-load en listas y skeletons en cargas.

---

Siguiente paso recomendado: activar los tokens del tema en `frontend-app/src/theme/variables.scss` y adaptar estilos de páginas como `login` a estas variables para un look & feel coherente y 100% responsivo.
