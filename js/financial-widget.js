/* ==========================================================================
   Financial Due Diligence & Sensitivity Calculator Widget
   Demonstrates Caden Belcourt's financial modeling & analytical skills
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  const loanInput = document.getElementById('input-loan');
  const ebitdaInput = document.getElementById('input-ebitda');
  const dscrInput = document.getElementById('input-dscr');

  const valLoan = document.getElementById('val-loan');
  const valEbitda = document.getElementById('val-ebitda');
  const valDscr = document.getElementById('val-dscr');

  const outMaxLoan = document.getElementById('out-max-loan');
  const outAnnualPayment = document.getElementById('out-payment');
  const riskBadge = document.getElementById('risk-badge');
  const chartCanvas = document.getElementById('financial-chart');

  if (!loanInput || !ebitdaInput || !dscrInput) return;

  function formatCurrency(val) {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      maximumFractionDigits: 0
    }).format(val);
  }

  function updateWidget() {
    const loanAmount = parseFloat(loanInput.value);
    const annualEbitda = parseFloat(ebitdaInput.value);
    const dscrTarget = parseFloat(dscrInput.value);

    // Update Slider Value Displays
    valLoan.textContent = formatCurrency(loanAmount);
    valEbitda.textContent = formatCurrency(annualEbitda);
    valDscr.textContent = dscrTarget.toFixed(2) + 'x';

    // Financial Calculation Formulae
    // Max annual debt service borrower can support based on EBITDA and DSCR target:
    const maxAnnualDebtService = annualEbitda / dscrTarget;
    
    // Assume 7-year amortization at 6.75% interest rate
    const interestRate = 0.0675;
    const termYears = 7;
    
    // Present Value of annuity (Max borrowing capacity)
    const r = interestRate;
    const n = termYears;
    const pvFactor = (1 - Math.pow(1 + r, -n)) / r;
    const maxBorrowingCapacity = maxAnnualDebtService * pvFactor;

    // Actual annual debt service for the requested loan amount
    const actualAnnualPayment = loanAmount / pvFactor;
    const actualDSCR = annualEbitda / actualAnnualPayment;

    // Update UI Metric Displays
    outMaxLoan.textContent = formatCurrency(maxBorrowingCapacity);
    outAnnualPayment.textContent = formatCurrency(actualAnnualPayment) + '/yr';

    // Update Risk Indicator
    if (actualDSCR >= 1.4) {
      riskBadge.className = 'risk-badge low';
      riskBadge.textContent = 'Low Risk (Strong DSCR: ' + actualDSCR.toFixed(2) + 'x)';
    } else if (actualDSCR >= 1.15) {
      riskBadge.className = 'risk-badge moderate';
      riskBadge.textContent = 'Moderate Risk (DSCR: ' + actualDSCR.toFixed(2) + 'x)';
    } else {
      riskBadge.className = 'risk-badge high';
      riskBadge.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
      riskBadge.style.color = '#ef4444';
      riskBadge.style.border = '1px solid rgba(239, 68, 68, 0.3)';
      riskBadge.textContent = 'High Sensitivity (DSCR: ' + actualDSCR.toFixed(2) + 'x)';
    }

    // Render SVG Visualization Chart
    renderChart(chartCanvas, annualEbitda, actualAnnualPayment, termYears);
  }

  function renderChart(canvas, ebitda, annualPayment, years) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const width = canvas.clientWidth || 300;
    const height = canvas.clientHeight || 140;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    const padding = 25;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    // Draw grid lines
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 3; i++) {
      const y = padding + (chartHeight / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Calculate bar coordinates for 5 projection years
    const numBars = 5;
    const barWidth = chartWidth / (numBars * 2.2);
    const maxVal = Math.max(ebitda * 1.2, annualPayment * 1.5);

    for (let i = 0; i < numBars; i++) {
      const yearEbitda = ebitda * (1 + i * 0.04); // 4% modest growth
      const xEbitda = padding + i * (chartWidth / numBars) + 5;
      const hEbitda = (yearEbitda / maxVal) * chartHeight;
      const yEbitda = height - padding - hEbitda;

      // Draw EBITDA Bar (Emerald)
      ctx.fillStyle = '#047857';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(xEbitda, yEbitda, barWidth, hEbitda, [3, 3, 0, 0]) : ctx.rect(xEbitda, yEbitda, barWidth, hEbitda);
      ctx.fill();

      // Draw Debt Service Bar (Navy)
      const xDebt = xEbitda + barWidth + 2;
      const hDebt = (annualPayment / maxVal) * chartHeight;
      const yDebt = height - padding - hDebt;

      ctx.fillStyle = '#1e3a8a';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(xDebt, yDebt, barWidth, hDebt, [3, 3, 0, 0]) : ctx.rect(xDebt, yDebt, barWidth, hDebt);
      ctx.fill();

      // Label Years
      ctx.fillStyle = '#64748b';
      ctx.font = '10px "Inter", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Yr ${i+1}`, xEbitda + barWidth, height - 6);
    }
  }

  // Attach Event Listeners
  loanInput.addEventListener('input', updateWidget);
  ebitdaInput.addEventListener('input', updateWidget);
  dscrInput.addEventListener('input', updateWidget);

  // Initial Calculation
  updateWidget();
  window.addEventListener('resize', updateWidget);
});
