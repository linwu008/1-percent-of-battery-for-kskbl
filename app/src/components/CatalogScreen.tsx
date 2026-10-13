import { useEffect, useState } from "react";
import { CATALOG, CATEGORIES, type Category } from "../catalog/catalog";

export default function CatalogScreen({ onBack }: { onBack: () => void }) {
  const [category, setCategory] = useState<Category>("resource");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState("energy");
  const items = CATALOG.filter(
    (e) =>
      e.category === category &&
      `${e.name} ${e.summary} ${e.facts.map((f) => f.value).join(" ")}`.includes(
        query.trim(),
      ),
  );
  const current = items.find((e) => e.id === selected) ?? items[0];
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);
  const tab = CATEGORIES.find((c) => c.id === category)!;
  return (
    <main className="catalog-screen">
      <header className="catalog-heading">
        <div>
          <span className="eyebrow">FIELD ARCHIVE / 行动档案</span>
          <h1>
            变量目录<span>DECISION ATLAS</span>
          </h1>
          <p>了解条件如何改变选择，让每一份余量都有去处。</p>
        </div>
        <button className="catalog-back" onClick={onBack}>
          返回主界面 <span>↗</span>
        </button>
      </header>
      <div className="catalog-layout">
        <nav className="catalog-nav" aria-label="目录分类">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              aria-pressed={category === c.id}
              onClick={() => {
                setCategory(c.id);
                setQuery("");
              }}
            >
              <span className="catalog-tab-index">{c.mark}</span>
              <span>
                <b>{c.name}</b>
                <small>{c.en}</small>
              </span>
              <i>
                {CATALOG.filter((e) => e.category === c.id)
                  .length.toString()
                  .padStart(2, "0")}
              </i>
            </button>
          ))}
          <p>
            规则先了解
            <br />
            权重在结算揭晓
          </p>
        </nav>
        <section className="catalog-list-panel" aria-label={`${tab.name}条目`}>
          <div className="catalog-list-top">
            <span>{tab.en}</span>
            <b>{items.length.toString().padStart(2, "0")}</b>
          </div>
          <label className="catalog-search">
            <span>⌕</span>
            <input
              aria-label="搜索当前分类"
              placeholder="搜索名称或作用…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </label>
          <div className="catalog-list">
            {items.map((e, i) => (
              <button
                key={e.id}
                aria-pressed={current?.id === e.id}
                onClick={() => setSelected(e.id)}
              >
                <span>{String(i + 1).padStart(2, "0")}</span>
                <b>{e.name}</b>
                <i>↗</i>
              </button>
            ))}
            {!items.length && (
              <p className="catalog-empty">
                没有找到相关条目。
                <button onClick={() => setQuery("")}>清空搜索</button>
              </p>
            )}
          </div>
        </section>
        <article
          className="catalog-detail"
          aria-live="polite"
          aria-atomic="true"
        >
          {current ? (
            <div key={current.id} className="catalog-detail-content">
              <div className="catalog-detail-code">
                <span>
                  {tab.mark} / {tab.en}
                </span>
                <span>FILE {current.id.toUpperCase()}</span>
              </div>
              <div className="catalog-detail-title">
                <span className="catalog-glyph">＋</span>
                <h2>{current.name}</h2>
              </div>
              <p className="catalog-summary">{current.summary}</p>
              <h3>
                <span>01</span> 条件与参数
              </h3>
              <dl className="catalog-facts">
                {current.facts.map((f) => (
                  <div key={f.label}>
                    <dt>{f.label}</dt>
                    <dd>{f.value}</dd>
                  </div>
                ))}
              </dl>
              <h3>
                <span>02</span> 在对局中意味着什么
              </h3>
              <ul className="catalog-examples">
                {current.examples.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
              <div className="catalog-detail-footer">
                <span>ONE% / 规则档案</span>
                <span>模拟参数 · 不是现实救援建议</span>
              </div>
            </div>
          ) : (
            <div className="catalog-empty">调整搜索，查看其他条件。</div>
          )}
        </article>
      </div>
    </main>
  );
}
