document.addEventListener("DOMContentLoaded", () => {

    // Sidebar & Dashboard Toggle Logic
    const sidebar = document.getElementById('sidebar');
    const dashboard = document.getElementById('dashboard-analytics');
    const mapSection = document.getElementById('map-section');
    const toggleSidebarBtn = document.getElementById('toggle-sidebar');
    const toggleDashboardBtn = document.getElementById('toggle-dashboard');

    if (toggleSidebarBtn) {
        toggleSidebarBtn.addEventListener('click', () => {
            const isClosed = sidebar.classList.contains('-translate-x-full');
            if (isClosed) {
                sidebar.classList.remove('-translate-x-full');
                mapSection.classList.add('ml-80');
                toggleSidebarBtn.querySelector('span').innerText = 'menu_open';
            } else {
                sidebar.classList.add('-translate-x-full');
                mapSection.classList.remove('ml-80');
                toggleSidebarBtn.querySelector('span').innerText = 'menu';
            }
            setTimeout(() => { if (window.map) window.map.updateSize(); }, 300);
        });
    }

    if (toggleDashboardBtn) {
        // [NUEVO] Hacer disponible globalmente
        window.openDashboard = () => {
            if (dashboard.classList.contains('translate-x-full')) {
                toggleDashboardBtn.click();
            }
        };

        toggleDashboardBtn.addEventListener('click', () => {
            const isClosed = dashboard.classList.contains('translate-x-full');
            if (isClosed) {
                dashboard.classList.remove('translate-x-full');
                mapSection.classList.add('mr-80');
                toggleDashboardBtn.querySelector('span').innerText = 'analytics';
            } else {
                dashboard.classList.add('translate-x-full');
                mapSection.classList.remove('mr-80');
                toggleDashboardBtn.querySelector('span').innerText = 'chevron_right';
            }
            setTimeout(() => { if (window.map) window.map.updateSize(); }, 300);
        });
    }

    // Attribute Panel Toggle Logic
    const attrPanel = document.getElementById('attribute-panel');
    const closePanelBtn = document.getElementById('close-panel');

    // Make the panel globally toggleable from map.js
    window.showFeatureInfo = (properties, title = "Detalles Capa") => {
        if (!properties || Object.keys(properties).length === 0) {
            window.hideFeatureInfo();
            return;
        }

        const titleEl = document.getElementById('attribute-panel-title');
        if (titleEl) titleEl.innerText = title;

        const tbody = document.getElementById('feature-info-content');
        if (tbody) tbody.innerHTML = ''; // clear y asegurar que existe

        // Diccionarios de mapeo personalizados por tipo de geometría
        const mappingPoligonos = {
            "1": "EDIFICACIÓN",
            "2": "OBRAS COMPLEMENTARIAS",
            "3": "PLANTACIONES PERMANENTES",
            "4": "PLANTACIONES FORESTALES",
            "5": "PLANTACIONES TRANSITORIAS"
        };

        const mappingLineasPuntos = {
            "1": "PLANTACIONES PERMANENTES",
            "2": "PLANTACIONES FORESTALES",
            "3": "CERCO VIVO",
            "4": "INFRAESTRUCTURA EXISTENTE",
            "5": "OBRAS COMPLEMENTARIAS"
        };

        // Seleccionar el diccionario adecuado según el título de la capa
        let currentMapping = {};
        const upperTitle = title.toUpperCase();
        if (upperTitle.includes("POLÍGONO")) {
            currentMapping = mappingPoligonos;
        } else if (upperTitle.includes("LÍNEA") || upperTitle.includes("PUNTO")) {
            currentMapping = mappingLineasPuntos;
        }

        for (const [key, value] of Object.entries(properties)) {
            const lowerKey = key.toLowerCase();
            if (lowerKey === 'bbox' || lowerKey === 'geom' || lowerKey === 'fid' || lowerKey === 'id interno') continue;

            // [NUEVO] Ocultar filas si el valor es nulo, indefinido o una cadena vacía
            if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
                continue;
            }

            let finalValue = value;

            // [CORREGIDO] Mapear el campo "Tipo" o "tipo" según la capa específica
            if (lowerKey === 'tipo' && currentMapping[String(value)]) {
                finalValue = currentMapping[String(value)];
            }

            const tr = document.createElement('tr');
            tr.className = 'border-b border-slate-100 hover:bg-slate-50 transition-colors';

            const tdKey = document.createElement('td');
            tdKey.className = 'py-2 px-2 text-xs font-bold text-slate-500 uppercase';
            tdKey.textContent = key.replace(/_/g, ' ');

            const tdValue = document.createElement('td');
            tdValue.className = 'py-2 px-2 text-xs text-slate-800 break-words font-medium';
            tdValue.style.maxWidth = '200px';
            tdValue.textContent = finalValue;

            tr.appendChild(tdKey);
            tr.appendChild(tdValue);
            tbody.appendChild(tr);
        }

        // Center on screen if it hasn't been moved yet
        if (attrPanel.style.top === '100px' || attrPanel.style.left.includes('100vw')) {
            requestAnimationFrame(() => {
                const w = attrPanel.offsetWidth || 320;
                const h = attrPanel.offsetHeight || 300;
                attrPanel.style.left = `${(window.innerWidth - w) / 2}px`;
                attrPanel.style.top = `${(window.innerHeight - h) / 2}px`;
            });
        }

        attrPanel.classList.remove('opacity-0', 'pointer-events-none');
        attrPanel.classList.add('opacity-100', 'pointer-events-auto');
    };

    window.hideFeatureInfo = () => {
        attrPanel.classList.remove('opacity-100', 'pointer-events-auto');
        attrPanel.classList.add('opacity-0', 'pointer-events-none');
    };

    closePanelBtn.addEventListener('click', () => {
        window.hideFeatureInfo();
        if (window.clearMapSelection) window.clearMapSelection();
    });

    // Make Attribute Panel Draggable
    const attrHeader = document.getElementById('attribute-panel-header');
    let isDragging = false;
    let offsetX, offsetY;

    if (attrHeader) {
        attrHeader.addEventListener('mousedown', (e) => {
            if (e.target.closest('#close-panel')) return;
            isDragging = true;
            offsetX = e.clientX - attrPanel.offsetLeft;
            offsetY = e.clientY - attrPanel.offsetTop;
            document.body.style.userSelect = 'none';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            let x = e.clientX - offsetX;
            let y = e.clientY - offsetY;

            const maxX = window.innerWidth - attrPanel.offsetWidth;
            const maxY = window.innerHeight - attrPanel.offsetHeight;

            attrPanel.style.left = `${Math.max(0, Math.min(x, maxX))}px`;
            attrPanel.style.top = `${Math.max(0, Math.min(y, maxY))}px`;
        });

        document.addEventListener('mouseup', () => {
            isDragging = false;
            document.body.style.userSelect = '';
        });
    }

    // --- ACCORDION LAYER GROUP LOGIC ---
    window.toggleGroup = function (groupCheckbox, groupId) {
        const childCheckboxes = document.querySelectorAll(`input[data-group="${groupId}"]`);
        childCheckboxes.forEach(cb => {
            if (cb.checked !== groupCheckbox.checked) {
                cb.checked = groupCheckbox.checked;
                cb.dispatchEvent(new Event('change')); // Trigger Map.js logic
            }
        });
    };

    // --- Dynamic Legend Logic ---
    const updateDynamicLegend = () => {
        const mapping = {
            'layer-predios': 'legend-item-predios',
            'layer-liberacion': 'legend-item-liberacion',
            'layer-poligono': 'legend-item-inv-poligono',
            'layer-linea': 'legend-item-inv-linea',
            'layer-punto': 'legend-item-inv-punto',
            'layer-lim-departamental': 'legend-item-lim-departamental',
            'layer-lim-provincial': 'legend-item-lim-provincial',
            'layer-lim-distrital': 'legend-item-lim-distrital'
        };

        // Update individual items
        for (const [cbId, legendId] of Object.entries(mapping)) {
            const cb = document.getElementById(cbId);
            const legendItem = document.getElementById(legendId);
            if (cb && legendItem) {
                if (cb.checked) {
                    legendItem.classList.remove('hidden');
                } else {
                    legendItem.classList.add('hidden');
                }
            }
        }

        // Update group headers
        const invGroup = document.getElementById('legend-group-inventario');
        if (invGroup) {
            const hasVisibleInv = ['layer-poligono', 'layer-linea', 'layer-punto'].some(id => document.getElementById(id)?.checked);
            invGroup.classList.toggle('hidden', !hasVisibleInv);
        }

        const limGroup = document.getElementById('legend-group-limites');
        if (limGroup) {
            const hasVisibleLim = ['layer-lim-departamental', 'layer-lim-provincial', 'layer-lim-distrital'].some(id => document.getElementById(id)?.checked);
            limGroup.classList.toggle('hidden', !hasVisibleLim);
        }
    };

    // Attach listeners to all layer checkboxes
    document.querySelectorAll('input[type="checkbox"][id^="layer-"], input[type="checkbox"][id^="group-"]').forEach(cb => {
        cb.addEventListener('change', () => {
            // Un pequeño delay para esperar a que window.toggleGroup termine si es un checkbox de grupo
            setTimeout(updateDynamicLegend, 50);
        });
    });

    // --- Inventory Summary Rendering ---
    const invSummaryContainer = document.getElementById('inventory-summary-container');
    const invSummaryList = document.getElementById('inventory-summary-list');
    const invPredioId = document.getElementById('inventory-predio-id');

    window.renderInventorySummary = (existencias, predioCode) => {
        if (!invSummaryContainer || !invSummaryList) return;

        invSummaryList.innerHTML = '';
        invPredioId.innerText = `CÓDIGO: ${predioCode}`;

        // existencias ahora es un objeto { LABEL: TOTAL }
        const items = Object.entries(existencias);

        if (items.length === 0) {
            invSummaryList.innerHTML = '<span class="text-[10px] text-slate-400 italic w-full">Sin mejoras detectadas.</span>';
        } else {
            items.forEach(([label, total]) => {
                const tag = document.createElement('span');
                tag.className = 'px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-tight shadow-sm hover:scale-105 transition-all cursor-default flex items-center gap-2';
                
                // Formato: NOMBRE (CANTIDAD)
                tag.innerHTML = `
                    <span>${label}</span>
                    <span class="bg-primary text-white font-bold rounded px-1.5 py-0.5 text-[8px] min-w-[18px] text-center">${total}</span>
                `;
                
                invSummaryList.appendChild(tag);
            });
        }

        invSummaryContainer.classList.remove('hidden');
        if (window.openDashboard) window.openDashboard();
    };

    window.clearInventorySummary = () => {
        if (invSummaryContainer) {
            invSummaryContainer.classList.add('hidden');
        }
    };

    // Initial run
    updateDynamicLegend();

    // Auto-update parent group checkbox when children change
    document.querySelectorAll('.group-content input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', (e) => {
            const groupId = e.target.getAttribute('data-group');
            const parentCb = document.querySelector(`input[onclick*="${groupId}"]`);
            if (parentCb) {
                const siblings = document.querySelectorAll(`input[data-group="${groupId}"]`);
                const allChecked = Array.from(siblings).every(s => s.checked);
                const someChecked = Array.from(siblings).some(s => s.checked);
                parentCb.checked = allChecked;
                parentCb.indeterminate = someChecked && !allChecked;
            }
        });
    });

    // Dark Theme Toggle (Optional enhancement based on Stitch mockup)
    const HTML = document.documentElement;
    const btnThemeToggle = document.getElementById('btn-theme-toggle');
    const themeIcon = btnThemeToggle.querySelector('span');

    btnThemeToggle.addEventListener('click', () => {
        if (HTML.classList.contains('light')) {
            HTML.classList.replace('light', 'dark');
            themeIcon.innerText = 'light_mode';
        } else {
            HTML.classList.replace('dark', 'light');
            themeIcon.innerText = 'dark_mode';
        }
    });

    // Search Execution Hook
    const searchInput = document.getElementById('search-input');
    const btnSearchExec = document.getElementById('btn-search-exec');

    const executeSearch = () => {
        const val = searchInput.value.trim();
        if (window.searchFeature && val !== '') {
            window.searchFeature(val);
        }
    };

    if (searchInput) {
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                executeSearch();
            }
        });
    }

    if (btnSearchExec) {
        btnSearchExec.addEventListener('click', executeSearch);
    }

    // --- Search Results Rendering ---
    const resultsContainer = document.getElementById('search-results-container');
    const resultsList = document.getElementById('search-results-list');
    const btnClearSearch = document.getElementById('btn-clear-search');

    window.renderSearchResults = (features) => {
        resultsList.innerHTML = '';
        if (!features || features.length === 0) {
            resultsContainer.classList.add('hidden');
            return;
        }

        resultsContainer.classList.remove('hidden');
        features.forEach(f => {
            const props = f.properties || {};
            const code = props.codigo || props.predio || props.Predio || 'S/N';

            const item = document.createElement('div');
            item.className = 'bg-white/50 hover:bg-white p-2 rounded-lg border border-slate-200 cursor-pointer transition-all hover:shadow-md group flex items-center gap-3';

            const icon = document.createElement('span');
            icon.className = 'material-symbols-outlined text-primary text-sm';
            icon.innerText = f.geometry.type === 'Point' ? 'location_on' : (f.geometry.type === 'LineString' ? 'show_chart' : 'layers');

            const content = document.createElement('div');
            content.className = 'flex flex-col';
            content.innerHTML = `
                <span class="text-[11px] font-extrabold text-slate-800">${code}</span>
                <span class="text-[9px] text-slate-500 uppercase tracking-tighter">${f._layerLabel}</span>
            `;

            item.appendChild(icon);
            item.appendChild(content);

            item.addEventListener('click', () => {
                if (window.selectSearchResult) {
                    window.selectSearchResult(f);
                }
            });

            resultsList.appendChild(item);
        });
    };

    if (btnClearSearch) {
        btnClearSearch.addEventListener('click', () => {
            resultsContainer.classList.add('hidden');
            resultsList.innerHTML = '';
            searchInput.value = '';
            if (window.clearMapSelection) window.clearMapSelection();
        });
    }

    // Floating Legend Popup Logic
    const legendPopup = document.getElementById('legend-popup');
    const toolLegendBtn = document.getElementById('tool-legend');
    const closeLegendBtn = document.getElementById('close-legend');

    const toggleLegend = () => {
        const isOpen = legendPopup.classList.contains('opacity-100');
        if (isOpen) {
            legendPopup.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
            legendPopup.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
            toolLegendBtn.classList.remove('bg-primary', 'text-white');
        } else {
            legendPopup.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
            legendPopup.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
            toolLegendBtn.classList.add('bg-primary', 'text-white');
        }
    };

    if (toolLegendBtn) {
        toolLegendBtn.addEventListener('click', toggleLegend);
    }

    if (closeLegendBtn) {
        closeLegendBtn.addEventListener('click', toggleLegend);
    }

    if (btnRefreshDashboard) {
        btnRefreshDashboard.addEventListener('click', () => {
            if (window.updateDashboard) {
                window.updateDashboard();
            }
        });
    }
});
