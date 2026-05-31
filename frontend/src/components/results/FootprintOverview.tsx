import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CatalogItem, CompanyInputs, FootprintResult } from "../../types";

const colors = ["#0d6b5f", "#2f8475", "#78a99f", "#cb6b36", "#d8a887"];

interface FootprintOverviewProps {
  footprint: FootprintResult | null;
  companyInputs: CompanyInputs;
  catalogs: {
    stationary: CatalogItem[];
    mobile: CatalogItem[];
    refrigerants: CatalogItem[];
  };
}

interface SourceSummaryCard {
  source: string;
  consumption: string;
  emission: number;
}

const formatNumber = (value: number, maximumFractionDigits = 2) =>
  new Intl.NumberFormat("es-ES", { maximumFractionDigits }).format(value);

const formatQuantity = (value: number, unit: string) => `${formatNumber(value)} ${unit}`;

const joinConsumptions = (items: string[]) => {
  if (items.length <= 2) return items.join(" · ");
  return `${items.slice(0, 2).join(" · ")} · +${items.length - 2} más`;
};

function getSourceSummaryCards(
  footprint: FootprintResult,
  companyInputs: CompanyInputs,
  catalogs: FootprintOverviewProps["catalogs"]
): SourceSummaryCard[] {
  const cards: SourceSummaryCard[] = [];

  const stationaryConsumptions = companyInputs.stationary_fuels
    .filter((entry) => entry.fuel_key && entry.quantity > 0)
    .map((entry) => {
      const fuel = catalogs.stationary.find((item) => item.key === entry.fuel_key);
      return formatQuantity(entry.quantity, fuel?.unit ?? "ud.");
    });

  if (stationaryConsumptions.length) {
    cards.push({
      source: "Combustión fija",
      consumption: joinConsumptions(stationaryConsumptions),
      emission: footprint.scope1_stationary_t,
    });
  }

  const mobileConsumptions = companyInputs.mobile_fuels
    .filter((entry) => entry.fuel_key && entry.quantity > 0)
    .map((entry) => {
      const fuel = catalogs.mobile.find((item) => item.key === entry.fuel_key);
      return formatQuantity(entry.quantity, fuel?.unit ?? "ud.");
    });

  if (mobileConsumptions.length) {
    cards.push({
      source: "Flota móvil",
      consumption: joinConsumptions(mobileConsumptions),
      emission: footprint.scope1_fleet_t,
    });
  }

  const refrigerantConsumptions = companyInputs.refrigerants
    .filter((entry) => entry.name && entry.quantity > 0)
    .map((entry) => formatQuantity(entry.quantity, "kg"));

  if (refrigerantConsumptions.length) {
    cards.push({
      source: "Refrigerantes",
      consumption: joinConsumptions(refrigerantConsumptions),
      emission: footprint.scope1_fugitive_t,
    });
  }

  const supplierElectricityMwh = companyInputs.scope2_supplier_rows.reduce(
    (sum, row) => sum + (row.consumo_mwh > 0 ? row.consumo_mwh : 0),
    0
  );
  const electricityMwh =
    supplierElectricityMwh > 0 ? supplierElectricityMwh : companyInputs.annual_electricity_mwh;

  if (electricityMwh > 0) {
    cards.push({
      source: "Electricidad comprada",
      consumption: formatQuantity(electricityMwh, "MWh/año"),
      emission: footprint.scope2_elec_t,
    });
  }

  if (companyInputs.annual_purchased_heat_mwh > 0) {
    cards.push({
      source: "Calor/vapor comprado",
      consumption: formatQuantity(companyInputs.annual_purchased_heat_mwh, "MWh/año"),
      emission: footprint.scope2_heat_t,
    });
  }

  return cards;
}

export function FootprintOverview({ footprint, companyInputs, catalogs }: FootprintOverviewProps) {
  if (!footprint) {
    return (
      <section className="panel empty-state">
        <h3>Huella de carbono</h3>
        <p>Calcula primero la huella para visualizar el desglose y la calidad del dato.</p>
      </section>
    );
  }

  const breakdown = Object.entries(footprint.breakdown).map(([name, value]) => ({ name, value }));
  const summaryCards = getSourceSummaryCards(footprint, companyInputs, catalogs);
  const warnings: string[] = [];

  if (footprint.refrigerant_factor_found === false && footprint.refrigerant_key) {
    warnings.push(
      `No se encontró GWP para '${footprint.refrigerant_key}'. La parte de fugitivas puede estar infraestimada.`
    );
  } else if ((footprint.refrigerant_gwp ?? 0) >= 2000) {
    warnings.push("Refrigerante con GWP alto. Considera plan de sustitución y control de fugas.");
  }

  if ((footprint.scope2_elec_t ?? 0) > 0 && (footprint.used_elec_factor ?? 0) === 0) {
    warnings.push("No hay factor eléctrico válido disponible; revisa el método y los factores.");
  }

  for (const note of footprint.scope2_notes ?? []) warnings.push(note);
  for (const error of footprint.scope2_errors ?? []) warnings.push(error);

  return (
    <section className="stack">
      <div className="hero-result panel">
        <div>
          <span className="badge">Resultado consolidado</span>
          <h2>{footprint.total_t.toFixed(1)} tCO2e/año</h2>
          <p>
            Alcance 1: {footprint.scope1_t.toFixed(1)} tCO2e · Alcance 2: {footprint.scope2_t.toFixed(1)} tCO2e
          </p>
        </div>
      </div>

      <div className="chart-grid chart-grid--results">
        <article className="panel">
          <h3>Desglose por fuente (tCO2e/año)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={breakdown} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92} cy="42%">
                {breakdown.map((entry, index) => (
                  <Cell key={entry.name} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Legend
                iconType="circle"
                verticalAlign="bottom"
                formatter={(value: string) => <span className="chart-legend-label">{value}</span>}
              />
              <Tooltip formatter={(value: number) => `${value.toFixed(2)} tCO2e`} />
            </PieChart>
          </ResponsiveContainer>
        </article>

        <article className="panel footprint-summary-panel">
          <h3>Resumen por fuente</h3>
          <div className="footprint-summary-grid">
            {summaryCards.map((card) => (
              <div className="footprint-source-card" key={card.source}>
                <h4>{card.source}</h4>
                <div>
                  <span>Consumo</span>
                  <p>{card.consumption}</p>
                </div>
                <div>
                  <span>Emisión</span>
                  <p>{formatNumber(card.emission)} tCO2e/año</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      {warnings.length ? (
        <article className="panel stack">
          <h3>Alertas y notas técnicas</h3>
          {warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="inline-banner inline-banner--warning">
              {warning}
            </div>
          ))}
        </article>
      ) : null}
    </section>
  );
}
