/* ==========================================================================
   Caden Belcourt - Featured Analytical Projects Interactive Engine
   Modules:
   1. Commercial Loan Capacity & DSCR Sensitivity Model
   2. Cost-Benefit Analysis & DCF Capital Budgeting (Econ 3750)
   3. Macroeconomic Econometrics: FTI vs. GDP OLS Regression (Econ Lab)
   4. Quantitative Paper Trading Journal & Equity Curve Engine
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Tab Switcher
  initProjectTabs();

  // Initialize Module 1: BDC Commercial Loan Sensitivity Model
  initLoanSensitivityModel();

  // Initialize Module 2: DCF / Cost-Benefit Model
  initDCFModel();

  // Initialize Module 3: Econometrics Regression Model
  initEconometricsModel();

  // Initialize Module 4: Paper Trading Journal Engine
  initTradingJournalEngine();

  // Re-render canvas charts on window resize or theme toggle
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(reRenderActiveCharts, 150);
  });

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      setTimeout(reRenderActiveCharts, 100);
    });
  }
});

/* --------------------------------------------------------------------------
   Tab Navigation Handler
   -------------------------------------------------------------------------- */
function initProjectTabs() {
  const tabBtns = document.querySelectorAll('.project-tab-btn');
  const tabPanes = document.querySelectorAll('.project-tab-pane');

  if (!tabBtns.length) return;

  function activateTab(btn) {
    const targetId = btn.getAttribute('data-tab');

    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
      b.setAttribute('tabindex', '-1');
    });
    tabPanes.forEach(p => p.classList.remove('active'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    btn.setAttribute('tabindex', '0');

    const targetPane = document.getElementById(targetId);
    if (targetPane) {
      targetPane.classList.add('active');
      // Trigger chart render for newly visible tab
      setTimeout(reRenderActiveCharts, 50);
    }
  }

  tabBtns.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      activateTab(btn);
      btn.focus();
    });

    // Arrow-key navigation between tabs (standard tab-widget keyboard pattern)
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = e.key === 'ArrowRight'
        ? tabBtns[(i + 1) % tabBtns.length]
        : tabBtns[(i - 1 + tabBtns.length) % tabBtns.length];
      activateTab(next);
      next.focus();
    });
  });
}

function reRenderActiveCharts() {
  const activePane = document.querySelector('.project-tab-pane.active');
  if (!activePane) return;

  const paneId = activePane.getAttribute('id');
  if (paneId === 'tab-loan') {
    const loanInput = document.getElementById('input-loan');
    if (loanInput) loanInput.dispatchEvent(new Event('input'));
  } else if (paneId === 'tab-dcf') {
    const dcfInput = document.getElementById('input-discount-rate');
    if (dcfInput) dcfInput.dispatchEvent(new Event('input'));
  } else if (paneId === 'tab-econometrics') {
    renderEconometricsChart();
  } else if (paneId === 'tab-trading') {
    renderTradingChart();
  }
}

/* --------------------------------------------------------------------------
   Helper Utilities
   -------------------------------------------------------------------------- */
function formatCurrency(val, compact = false) {
  if (compact && Math.abs(val) >= 1e9) {
    return '$' + (val / 1e9).toFixed(2) + 'B';
  }
  if (compact && Math.abs(val) >= 1e6) {
    return '$' + (val / 1e6).toFixed(2) + 'M';
  }
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: 0
  }).format(val);
}

function getThemeColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    isDark,
    textPrimary: isDark ? '#f8fafc' : '#0f172a',
    textMuted: isDark ? '#94a3b8' : '#64748b',
    borderColor: isDark ? '#334155' : '#e2e8f0',
    accentBlue: isDark ? '#3b82f6' : '#2563eb',
    accentBlueSubtle: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.1)',
    accentEmerald: isDark ? '#10b981' : '#047857',
    accentGold: isDark ? '#f59e0b' : '#b45309',
    accentRed: isDark ? '#ef4444' : '#dc2626',
    gridLine: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
    cardBg: isDark ? '#1e293b' : '#ffffff'
  };
}

/* ==========================================================================
   MODULE 1: BDC Commercial Loan Capacity & Sensitivity Model
   ========================================================================== */
function initLoanSensitivityModel() {
  const loanInput = document.getElementById('input-loan');
  const ebitdaInput = document.getElementById('input-ebitda');
  const dscrInput = document.getElementById('input-dscr');

  if (!loanInput || !ebitdaInput || !dscrInput) return;

  const valLoan = document.getElementById('val-loan');
  const valEbitda = document.getElementById('val-ebitda');
  const valDscr = document.getElementById('val-dscr');

  const outMaxLoan = document.getElementById('out-max-loan');
  const outAnnualPayment = document.getElementById('out-payment');
  const riskBadge = document.getElementById('risk-badge');
  const chartCanvas = document.getElementById('financial-chart');

  function updateModel() {
    const loanAmount = parseFloat(loanInput.value);
    const annualEbitda = parseFloat(ebitdaInput.value);
    const dscrTarget = parseFloat(dscrInput.value);

    if (valLoan) valLoan.textContent = formatCurrency(loanAmount);
    if (valEbitda) valEbitda.textContent = formatCurrency(annualEbitda);
    if (valDscr) valDscr.textContent = dscrTarget.toFixed(2) + 'x';

    const maxAnnualDebtService = annualEbitda / dscrTarget;
    const interestRate = 0.0675;
    const termYears = 7;
    const r = interestRate;
    const n = termYears;
    const pvFactor = (1 - Math.pow(1 + r, -n)) / r;
    const maxBorrowingCapacity = maxAnnualDebtService * pvFactor;
    const actualAnnualPayment = loanAmount / pvFactor;
    const actualDSCR = annualEbitda / actualAnnualPayment;

    if (outMaxLoan) outMaxLoan.textContent = formatCurrency(maxBorrowingCapacity);
    if (outAnnualPayment) outAnnualPayment.textContent = formatCurrency(actualAnnualPayment) + '/yr';

    if (riskBadge) {
      if (actualDSCR >= 1.40) {
        riskBadge.className = 'risk-badge low';
        riskBadge.textContent = 'Low Risk (DSCR: ' + actualDSCR.toFixed(2) + 'x)';
      } else if (actualDSCR >= 1.15) {
        riskBadge.className = 'risk-badge moderate';
        riskBadge.textContent = 'Moderate Risk (DSCR: ' + actualDSCR.toFixed(2) + 'x)';
      } else {
        riskBadge.className = 'risk-badge high';
        riskBadge.textContent = 'High Sensitivity (DSCR: ' + actualDSCR.toFixed(2) + 'x)';
      }
    }

    renderLoanChart(chartCanvas, annualEbitda, actualAnnualPayment, termYears);
  }

  [loanInput, ebitdaInput, dscrInput].forEach(inp => {
    inp.addEventListener('input', updateModel);
  });

  updateModel();
}

function renderLoanChart(canvas, ebitda, annualPayment, years) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.parentElement.clientWidth || 400;
  const height = 180;

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const colors = getThemeColors();
  const padding = { top: 25, right: 20, bottom: 30, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxY = Math.max(ebitda * 1.25, annualPayment * 1.5, 100000);

  // Grid lines
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = padding.top + (chartH / 3) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxY * (1 - i / 3);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(val / 1000) + 'k', padding.left - 8, y + 4);
  }

  const stepX = chartW / (years - 1);

  // EBITDA Line
  ctx.beginPath();
  ctx.strokeStyle = colors.accentEmerald;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < years; i++) {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH * (1 - ebitda / maxY);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Debt Service Line
  ctx.beginPath();
  ctx.strokeStyle = colors.accentRed;
  ctx.lineWidth = 2.5;
  ctx.setLineDash([5, 4]);
  for (let i = 0; i < years; i++) {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH * (1 - annualPayment / maxY);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // X Axis Labels
  for (let i = 0; i < years; i++) {
    const x = padding.left + i * stepX;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Yr ' + (i + 1), x, height - 10);
  }
}

/* ==========================================================================
   MODULE 2: Cost-Benefit Analysis & DCF Capital Budgeting (Econ 3750)
   ========================================================================== */
// Data set directly from Econ 3750 screenshot
const dcfData = [
  { t: 0, benefit: 0, cost: 135 },
  { t: 1, benefit: 0, cost: 125 },
  { t: 2, benefit: 160, cost: 150 },
  { t: 3, benefit: 160, cost: 140 },
  { t: 4, benefit: 160, cost: 120 },
  { t: 5, benefit: 160, cost: 100 },
  { t: 6, benefit: 160, cost: 100 },
  { t: 7, benefit: 160, cost: 100 },
  { t: 8, benefit: 160, cost: 100 },
  { t: 9, benefit: 160, cost: 100 },
  { t: 10, benefit: 160, cost: 100 },
  { t: 11, benefit: 160, cost: 100 },
  { t: 12, benefit: 160, cost: 100 },
  { t: 13, benefit: 160, cost: 100 },
  { t: 14, benefit: 160, cost: 100 },
  { t: 15, benefit: 160, cost: 100 },
  { t: 16, benefit: 160, cost: 100 },
  { t: 17, benefit: 160, cost: 150 }
];

function initDCFModel() {
  const rateInput = document.getElementById('input-discount-rate');
  const valRate = document.getElementById('val-discount-rate');
  const outNPV = document.getElementById('out-dcf-npv');
  const outBCR = document.getElementById('out-dcf-bcr');
  const outTotalBenefits = document.getElementById('out-total-benefits');
  const outTotalCosts = document.getElementById('out-total-costs');
  const chartCanvas = document.getElementById('dcf-chart');
  const tableBody = document.getElementById('dcf-table-body');

  if (!rateInput) return;

  function updateDCF() {
    const ratePercent = parseFloat(rateInput.value);
    const r = ratePercent / 100;

    if (valRate) valRate.textContent = ratePercent.toFixed(1) + '%';

    let totalPVBenefits = 0;
    let totalPVCosts = 0;

    const computedRows = dcfData.map(row => {
      const discountFactor = 1 / Math.pow(1 + r, row.t);
      const pvBenefit = row.benefit * discountFactor;
      const pvCost = row.cost * discountFactor;

      totalPVBenefits += pvBenefit;
      totalPVCosts += pvCost;

      return {
        t: row.t,
        benefit: row.benefit,
        cost: row.cost,
        discountFactor,
        pvBenefit,
        pvCost
      };
    });

    const npv = totalPVBenefits - totalPVCosts;
    const bcr = totalPVCosts > 0 ? totalPVBenefits / totalPVCosts : 0;

    if (outNPV) {
      outNPV.textContent = '$' + npv.toFixed(2) + 'M';
      outNPV.style.color = npv >= 0 ? 'var(--accent-emerald)' : 'var(--accent-red)';
    }
    if (outBCR) {
      outBCR.textContent = bcr.toFixed(3) + 'x';
      outBCR.style.color = bcr >= 1.0 ? 'var(--accent-emerald)' : 'var(--accent-red)';
    }
    if (outTotalBenefits) outTotalBenefits.textContent = '$' + totalPVBenefits.toFixed(2) + 'M';
    if (outTotalCosts) outTotalCosts.textContent = '$' + totalPVCosts.toFixed(2) + 'M';

    // Populate Table Sample (Years 0, 1, 2, 5, 10, 17)
    if (tableBody) {
      const sampleYears = [0, 1, 2, 5, 10, 17];
      tableBody.innerHTML = sampleYears.map(year => {
        const item = computedRows.find(d => d.t === year);
        if (!item) return '';
        return `
          <tr>
            <td><strong>Year ${item.t}</strong></td>
            <td>$${item.benefit}M</td>
            <td>$${item.cost}M</td>
            <td>${item.discountFactor.toFixed(4)}</td>
            <td style="color: var(--accent-emerald); font-weight: 500;">$${item.pvBenefit.toFixed(2)}M</td>
            <td style="color: var(--accent-blue); font-weight: 500;">$${item.pvCost.toFixed(2)}M</td>
          </tr>
        `;
      }).join('');
    }

    renderDCFChart(chartCanvas, computedRows);
  }

  rateInput.addEventListener('input', updateDCF);
  updateDCF();
}

function renderDCFChart(canvas, data) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.parentElement.clientWidth || 500;
  const height = 220;

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const colors = getThemeColors();
  const padding = { top: 25, right: 20, bottom: 35, left: 50 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const maxVal = 180;
  const stepX = chartW / data.length;

  // Grid
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxVal * (1 - i / 4);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(val) + 'M', padding.left - 6, y + 4);
  }

  // Draw PV Benefits & PV Costs Bars
  const barWidth = Math.max(3, stepX * 0.35);

  data.forEach((d, i) => {
    const xCenter = padding.left + i * stepX + stepX / 2;

    // PV Benefit Bar
    const bHeight = chartH * (d.pvBenefit / maxVal);
    const bY = padding.top + chartH - bHeight;
    ctx.fillStyle = colors.accentEmerald;
    ctx.fillRect(xCenter - barWidth, bY, barWidth, bHeight);

    // PV Cost Bar
    const cHeight = chartH * (d.pvCost / maxVal);
    const cY = padding.top + chartH - cHeight;
    ctx.fillStyle = colors.accentBlue;
    ctx.fillRect(xCenter, cY, barWidth, cHeight);
  });

  // X Axis Year Labels
  data.forEach((d, i) => {
    if (i % 2 === 0 || i === data.length - 1) {
      const xCenter = padding.left + i * stepX + stepX / 2;
      ctx.fillStyle = colors.textMuted;
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('t=' + d.t, xCenter, height - 12);
    }
  });
}

/* ==========================================================================
   MODULE 3: Macroeconomic Econometrics: FTI vs. GDP OLS Regression (Econ Lab)
   ========================================================================== */
// Data points directly from Econ Lab screenshot (Years 2000 to 2023)
const ftiGdpData = [
  { year: 2023, fti: 8.11, gdp: 2.20626e13 },
  { year: 2022, fti: 8.11, gdp: 2.14434e13 },
  { year: 2021, fti: 8.08, gdp: 2.09179e13 },
  { year: 2020, fti: 8.08, gdp: 1.97236e13 },
  { year: 2019, fti: 8.15, gdp: 2.01596e13 },
  { year: 2018, fti: 8.10, gdp: 1.96519e13 },
  { year: 2017, fti: 8.19, gdp: 1.90857e13 },
  { year: 2016, fti: 8.16, gdp: 1.86279e13 },
  { year: 2015, fti: 8.10, gdp: 1.82954e13 },
  { year: 2014, fti: 8.11, gdp: 1.77715e13 },
  { year: 2013, fti: 8.22, gdp: 1.73341e13 },
  { year: 2012, fti: 8.24, gdp: 1.69746e13 },
  { year: 2011, fti: 8.25, gdp: 1.65947e13 },
  { year: 2010, fti: 8.25, gdp: 1.63391e13 },
  { year: 2009, fti: 8.19, gdp: 1.59103e13 },
  { year: 2008, fti: 8.42, gdp: 1.63311e13 },
  { year: 2007, fti: 8.47, gdp: 1.63125e13 },
  { year: 2006, fti: 8.48, gdp: 1.59921e13 },
  { year: 2005, fti: 8.38, gdp: 1.55588e13 },
  { year: 2004, fti: 8.84, gdp: 1.50351e13 },
  { year: 2003, fti: 8.79, gdp: 1.44780e13 },
  { year: 2002, fti: 8.76, gdp: 1.40842e13 },
  { year: 2001, fti: 8.87, gdp: 1.38488e13 },
  { year: 2000, fti: 8.94, gdp: 1.37177e13 }
];

function initEconometricsModel() {
  const chartCanvas = document.getElementById('econometrics-chart');
  if (chartCanvas) {
    renderEconometricsChart();
  }
}

function renderEconometricsChart() {
  const canvas = document.getElementById('econometrics-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.parentElement.clientWidth || 500;
  const height = 260;

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const colors = getThemeColors();
  const padding = { top: 25, right: 25, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Domain & Range
  const minX = 8.00;
  const maxX = 9.00;
  const minY = 1.2e13;
  const maxY = 2.4e13;

  // Grid & Axis
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;

  // Y Grid
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxY - ((maxY - minY) / 4) * i;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + (val / 1e12).toFixed(1) + 'T', padding.left - 6, y + 4);
  }

  // X Grid
  for (let i = 0; i <= 5; i++) {
    const x = padding.left + (chartW / 5) * i;
    ctx.beginPath();
    ctx.moveTo(x, padding.top);
    ctx.lineTo(x, height - padding.bottom);
    ctx.stroke();

    const val = minX + ((maxX - minX) / 5) * i;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(val.toFixed(2), x, height - padding.bottom + 16);
  }

  // OLS Regression Line (Correlation = -0.835)
  const xStart = minX;
  const yStartFit = 2.35e13 - (xStart - 8.0) * 0.95e13;
  const xEnd = maxX;
  const yEndFit = 2.35e13 - (xEnd - 8.0) * 0.95e13;

  const p1X = padding.left + ((xStart - minX) / (maxX - minX)) * chartW;
  const p1Y = padding.top + chartH - ((yStartFit - minY) / (maxY - minY)) * chartH;
  const p2X = padding.left + ((xEnd - minX) / (maxX - minX)) * chartW;
  const p2Y = padding.top + chartH - ((yEndFit - minY) / (maxY - minY)) * chartH;

  ctx.beginPath();
  ctx.strokeStyle = colors.accentBlue;
  ctx.lineWidth = 2;
  ctx.moveTo(p1X, p1Y);
  ctx.lineTo(p2X, p2Y);
  ctx.stroke();

  // Draw Data Points
  ftiGdpData.forEach(d => {
    const cx = padding.left + ((d.fti - minX) / (maxX - minX)) * chartW;
    const cy = padding.top + chartH - ((d.gdp - minY) / (maxY - minY)) * chartH;

    ctx.beginPath();
    ctx.arc(cx, cy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = colors.accentNavy;
    ctx.fill();
    ctx.strokeStyle = colors.cardBg;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });

  // Chart Titles / Axis Labels
  ctx.fillStyle = colors.textPrimary;
  ctx.font = '500 11px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Freedom to Trade Index (FTI)', padding.left + chartW / 2, height - 8);
}

/* ==========================================================================
   MODULE 4: Quantitative Paper Trading Journal & Equity Curve Engine
   ========================================================================== */
/* ==========================================================================
   MODULE 4: Quantitative Paper Trading Journal & Equity Curve Engine
   ========================================================================== */
// Full 33-Trade Dataset transcribed from Paperview Trading Practice Journal
const tradingLogData = [
  { row: 1, date: '10-May-25', symbol: 'BTC USDC', tf: '5min', strategy: 'Supp/Resis', marketType: 'Ranging', pnl: 618.60, balance: 50618.60 },
  { row: 2, date: '11-May-25', symbol: 'BTC USDC', tf: '5min', strategy: 'Bollinger/RSI/EMA', marketType: 'Ranging', pnl: 150.00, balance: 50768.60 },
  { row: 3, date: '12-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Supp/Resis', marketType: 'Ranging', pnl: 150.00, balance: 50918.60 },
  { row: 4, date: '13-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Supp/Resis/Liqu Sweep', marketType: 'Ranging', pnl: 550.00, balance: 51468.60 },
  { row: 5, date: '14-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Bollinger/RSI/Trend Line', marketType: 'Trending', pnl: 460.00, balance: 51928.60 },
  { row: 6, date: '15-May-25', symbol: 'NQ MINI', tf: '15min', strategy: 'RSI/Trend Line', marketType: 'Trending', pnl: 285.00, balance: 52213.60 },
  { row: 7, date: '16-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'RSI/Trend Line', marketType: 'Trending', pnl: 655.00, balance: 52868.60 },
  { row: 8, date: '17-May-25', symbol: 'BTC USDC', tf: '1min', strategy: 'RSI', marketType: 'Trending', pnl: 87.00, balance: 52955.60 },
  { row: 9, date: '18-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Price Action', marketType: 'Trending', pnl: 595.00, balance: 53550.60 },
  { row: 10, date: '19-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Price Action', marketType: 'Trending', pnl: 515.00, balance: 54065.60 },
  { row: 11, date: '20-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Price Action', marketType: 'Trending', pnl: 335.00, balance: 54400.60 },
  { row: 12, date: '21-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Price Action', marketType: 'Trending', pnl: -300.00, balance: 54100.60 },
  { row: 13, date: '22-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Breakout', marketType: 'Ranging', pnl: 2040.00, balance: 56140.60 },
  { row: 14, date: '23-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Breakout', marketType: 'Ranging', pnl: 2655.00, balance: 58795.60 },
  { row: 15, date: '24-May-25', symbol: 'BTC USD', tf: '5min', strategy: 'Scalp Stopout', marketType: 'Ranging', pnl: -554.00, balance: 58241.60 },
  { row: 16, date: '25-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Trend Reversal', marketType: 'Trending', pnl: 917.00, balance: 59158.60 },
  { row: 17, date: '26-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Mean Reversion', marketType: 'Ranging', pnl: -1425.00, balance: 57733.60 },
  { row: 18, date: '27-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Mean Reversion', marketType: 'Ranging', pnl: -700.00, balance: 57033.60 },
  { row: 19, date: '28-May-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Structure Reclaim', marketType: 'Ranging', pnl: 1952.50, balance: 58986.10 },
  { row: 20, date: '02-Jun-25', symbol: 'NQ MINI/ES', tf: '5min', strategy: 'EMA 50/100', marketType: 'Trending', pnl: 5039.00, balance: 64025.10 },
  { row: 21, date: '03-Jun-25', symbol: 'NQ MINI/ES', tf: '5min', strategy: 'EMA Trend Continuous', marketType: 'Trending', pnl: 1320.00, balance: 65345.10 },
  { row: 22, date: '04-Jun-25', symbol: 'NQ MINI/ES', tf: '5min', strategy: 'EMA Trend Continuous', marketType: 'Trending', pnl: 725.00, balance: 66070.10 },
  { row: 23, date: '05-Jun-25', symbol: 'NQ MINI/ES', tf: '5min', strategy: 'Momentum Expansion', marketType: 'Trending', pnl: 6672.50, balance: 72742.60 },
  { row: 24, date: '06-Jun-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Momentum Expansion', marketType: 'Trending', pnl: 4575.00, balance: 77317.60 },
  { row: 25, date: '08-Jun-25', symbol: 'NQ MINI/ES', tf: '5min', strategy: 'Trend Extension', marketType: 'Trending', pnl: 2190.00, balance: 79507.60 },
  { row: 26, date: '09-Jun-25', symbol: 'NQ MINI/ES', tf: '5min', strategy: 'Trend Extension', marketType: 'Trending', pnl: 2940.00, balance: 82447.60 },
  { row: 27, date: '10-Jun-25', symbol: 'NQ MINI/ES', tf: '15min', strategy: '15m Trend Breakout', marketType: 'Trending', pnl: 5770.00, balance: 88217.60 },
  { row: 28, date: '11-Jun-25', symbol: 'NQ MINI/ES', tf: '15min', strategy: 'Pullback Stopout', marketType: 'Trending', pnl: -7280.00, balance: 80937.60 },
  { row: 29, date: '16-Jun-25', symbol: 'NQ MINI', tf: '15min', strategy: 'Major Breakout', marketType: 'Trending', pnl: 14475.00, balance: 95412.60 },
  { row: 30, date: '17-Jun-25', symbol: 'NQ MINI', tf: '15min', strategy: 'Range Expansion', marketType: 'Ranging', pnl: 7980.00, balance: 103392.60 },
  { row: 31, date: '18-Jun-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Intraday Scalp', marketType: 'Trending', pnl: 4080.00, balance: 107472.60 },
  { row: 32, date: '19-Jun-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Intraday Scalp', marketType: 'Trending', pnl: 5760.00, balance: 113232.60 },
  { row: 33, date: '20-Jun-25', symbol: 'NQ MINI', tf: '5min', strategy: 'Intraday Scalp', marketType: 'Trending', pnl: 3990.00, balance: 117222.60 }
];

function initTradingJournalEngine() {
  const chartCanvas = document.getElementById('trading-chart');
  const tableBody = document.getElementById('trading-table-body');

  if (tableBody) {
    tableBody.innerHTML = tradingLogData.map(trade => {
      const pnlClass = trade.pnl >= 0 ? 'pnl-positive' : 'pnl-negative';
      const pnlFormatted = (trade.pnl >= 0 ? '+' : '') + formatCurrency(trade.pnl);
      return `
        <tr>
          <td><strong>${trade.date}</strong></td>
          <td><span class="ticker-badge">${trade.symbol}</span></td>
          <td>${trade.tf}</td>
          <td><span class="strat-badge">${trade.strategy}</span></td>
          <td><span class="strat-badge" style="background: var(--bg-subtle);">${trade.marketType}</span></td>
          <td class="${pnlClass}">${pnlFormatted}</td>
          <td><strong>${formatCurrency(trade.balance)}</strong></td>
        </tr>
      `;
    }).join('');
  }

  if (chartCanvas) {
    renderTradingChart();
  }
}

function renderTradingChart() {
  const canvas = document.getElementById('trading-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const width = canvas.parentElement.clientWidth || 600;
  const height = 240;

  canvas.width = width;
  canvas.height = height;
  ctx.clearRect(0, 0, width, height);

  const colors = getThemeColors();
  const padding = { top: 25, right: 25, bottom: 40, left: 65 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const points = [50000, ...tradingLogData.map(d => d.balance)];
  const minY = 45000;
  const maxY = 125000;

  // Grid lines
  ctx.strokeStyle = colors.gridLine;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padding.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    const val = maxY - ((maxY - minY) / 4) * i;
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText('$' + Math.round(val / 1000) + 'k', padding.left - 8, y + 4);
  }

  const stepX = chartW / (points.length - 1);

  // Gradient fill under equity line
  const grad = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom);
  grad.addColorStop(0, colors.accentBlueSubtle);
  grad.addColorStop(1, 'rgba(59, 130, 246, 0.0)');

  ctx.beginPath();
  points.forEach((pt, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((pt - minY) / (maxY - minY)) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(padding.left + chartW, height - padding.bottom);
  ctx.lineTo(padding.left, height - padding.bottom);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Equity Line
  ctx.beginPath();
  ctx.strokeStyle = colors.accentBlue;
  ctx.lineWidth = 2.5;
  points.forEach((pt, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((pt - minY) / (maxY - minY)) * chartH;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points (highlight starting, peak, and final points)
  points.forEach((pt, i) => {
    const x = padding.left + i * stepX;
    const y = padding.top + chartH - ((pt - minY) / (maxY - minY)) * chartH;

    if (i === 0 || i === points.length - 1 || pt === 117222.60) {
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = i === points.length - 1 ? colors.accentEmerald : colors.accentBlue;
      ctx.fill();
      ctx.strokeStyle = colors.cardBg;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  });

  // X Axis Date / Trade Index Labels
  const labelIndices = [0, 8, 16, 24, 33];
  labelIndices.forEach(idx => {
    const x = padding.left + idx * stepX;
    const dateText = idx === 0 ? 'May 10' : tradingLogData[idx - 1].date.substring(0, 6);
    ctx.fillStyle = colors.textMuted;
    ctx.font = '10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(dateText, x, height - 12);
  });
}
