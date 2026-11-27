try {
      if (typeof tailwind !== 'undefined') {
        tailwind.config = {
          theme: {
            extend: {
              fontFamily: {
                serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
                sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'sans-serif'],
              },
              colors: {
                linen: 'var(--bg-linen)',
                paper: 'var(--bg-paper)',
                paperAlt: 'var(--bg-paper-alt)',
                sand: 'var(--border-sand)',
                sandDark: 'var(--border-sand-dark)',
                ink: 'var(--text-ink)',
                inkSoft: 'var(--text-ink-soft)',
                inkMuted: 'var(--text-ink-muted)',
                piment: 'var(--accent-piment)',
                pimentHover: 'var(--accent-piment-hover)',
                pimentSoft: 'var(--accent-piment-soft)',
                brass: 'var(--accent-brass)',
                brassSoft: 'var(--accent-brass-soft)',
              },
              boxShadow: {
                editorial: 'var(--shadow-editorial)',
                editorialHover: 'var(--shadow-editorial-hover)',
                cardFlip: 'var(--shadow-card-flip)',
              }
            }
          }
        };
      }
    } catch (e) {
      // Repli silencieux si Tailwind non chargé
    }
