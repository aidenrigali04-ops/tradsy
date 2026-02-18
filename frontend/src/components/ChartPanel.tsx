import { useEffect, useRef } from "react";

const DEFAULT_SYMBOL = "AAPL";
const DEFAULT_INTERVAL = "1D";

/**
 * TradingView chart area.
 * Uses TradingView's free Advanced Chart widget (read-only).
 * For full trading UI and Broker API integration, use the Charting Library with a license.
 */
export default function ChartPanel({ symbol = DEFAULT_SYMBOL, interval = DEFAULT_INTERVAL }: { symbol?: string; interval?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      autosize: true,
      symbol,
      interval,
      timezone: "Etc/UTC",
      theme: "light",
      style: "1",
      locale: "en",
      enable_publishing: false,
      hide_top_toolbar: false,
      hide_legend: false,
      save_image: false,
      container_id: "tradingview_chart_container",
    });
    containerRef.current.innerHTML = "";
    const wrapper = document.createElement("div");
    wrapper.id = "tradingview_chart_container";
    wrapper.style.height = "100%";
    wrapper.style.minHeight = "400px";
    containerRef.current.appendChild(wrapper);
    const inner = document.createElement("div");
    inner.style.height = "100%";
    inner.style.minHeight = "400px";
    wrapper.appendChild(inner);
    inner.appendChild(script);
    return () => {
      if (containerRef.current) containerRef.current.innerHTML = "";
    };
  }, [symbol, interval]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", minHeight: 400 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", minHeight: 400 }} />
    </div>
  );
}
