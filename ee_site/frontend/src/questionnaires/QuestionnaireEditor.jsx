import { useViewportAnchor } from "./useViewportAnchor.js";
import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { leadDraft } from "../api/leadDraft.js";
import {
  contract,
  applicable,
  activeSheets,
  initialQuestionnaire,
  requiredFieldCount,
  changeUnit,
  blank,
} from "./domain.js";
import { updateQuestionnaire } from "./state.js";
import { selectedProduct } from "./state.js";
import NumericInput from "./NumericInput.jsx";
import { fieldHint } from "./hints.js";

function Quantity({ field, value, onChange, invalid, id, describedBy, placeholder }) {
  const [unitError, setUnitError] = useState("");
  const unit = value?.unit || field.unit;
  return (
    <>
      <div className="ql-quantity">
        <NumericInput
          field={field}
          placeholder={placeholder}
          id={id}
          value={field.units ? value?.value || "" : value || ""}
          aria-required={field.required || undefined}
          aria-describedby={describedBy}
          aria-invalid={invalid || undefined}
          onChange={(text) => {
            setUnitError("");
            onChange(field.units ? { value: text, unit } : text);
          }}
        />
        {field.units ? (
          <select
            aria-label={"Единица: " + field.label}
            value={unit}
            onChange={(e) => {
              const next = changeUnit(
                value || { value: "", unit },
                e.target.value,
                field.units,
              );
              if (next) {
                setUnitError("");
                onChange(next);
              } else
                setUnitError(
                  "Сначала завершите ввод числа — значение сохранено.",
                );
            }}
          >
            {Object.keys(contract.units[field.units]).map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        ) : (
          <span>{field.unit}</span>
        )}
      </div>
      {unitError && <span role="status">{unitError}</span>}
    </>
  );
}
function AnswerField({ field, value, onChange, path, errors, focusKey }) {
  const id = useId();
  const ref = useRef(null);
  const error = errors[path];
  const hint = fieldHint(path);
  const describedBy =
    [field.help || hint ? id + "-help" : "", error ? id + "-error" : ""]
      .filter(Boolean)
      .join(" ") || undefined;
  useEffect(() => {
    if (focusKey === path && leadDraft.get().questionnaireFocus === path) {
      const field = ref.current;
      if (!field) return;
      field.scrollIntoView({ block: "nearest", behavior: "instant" });
      field.querySelector("input,select,textarea")?.focus({ preventScroll: true });
      if (!field.closest("dialog:modal") && window.matchMedia("(max-width: 960px)").matches) {
        const header = document.querySelector(".header")?.getBoundingClientRect().height || 0;
        const nav = field.closest(".ql-panel")?.querySelector(".ql-nav");
        const visibleTop = header + (nav?.getBoundingClientRect().height || 0) + 12;
        const top = field.getBoundingClientRect().top;
        if (top < visibleTop) window.scrollBy({ top: top - visibleTop, behavior: "instant" });
      }
      // Consume this explicit validation request; revisiting the sheet through
      // its navigation must not replay an old focus/scroll command.
      leadDraft.update({ questionnaireFocus: "" }, { content: false });
    }
  }, [focusKey, path]);
  return (
    <div className={"ql-field" + (error ? " ql-field--error" : "")} ref={ref}>
      <label htmlFor={id}>
        {field.label}
        {field.required && <small>Обязательно</small>}
      </label>
      {field.type === "number" ? (
        <Quantity
          field={field}
          value={value}
          onChange={onChange}
          invalid={!!error}
          describedBy={describedBy}
          placeholder={hint}
          id={id}
        />
      ) : field.type === "choice" ? (
        <select
          id={id}
          aria-describedby={describedBy}
          aria-required={field.required || undefined}
          value={value || ""}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Не указано</option>
          {field.options.map((o) => (
            <option key={o} disabled={field.disabledOptions?.includes(o)}>
              {o}
            </option>
          ))}
        </select>
      ) : field.type === "longtext" ? (
        <textarea
          id={id}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          aria-required={field.required || undefined}
          placeholder={hint}
          rows="3"
          maxLength={contract.limits.text}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={!!error}
          aria-required={field.required || undefined}
          type="text"
          placeholder={hint}
          maxLength={contract.limits.text}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      )}{" "}
      {(field.help || hint) && <small id={id + "-help"}>{field.help || hint}</small>}
      {error && (
        <span id={id + "-error"} className="ql-error" role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
export default function QuestionnaireEditor({ products, initialTopic }) {
  const d = useSyncExternalStore(
    leadDraft.subscribe,
    leadDraft.get,
    leadDraft.getServerSnapshot,
  );
  const product = selectedProduct(d, products, initialTopic);
  const definition = contract.products[product];
  const workspace = useRef(null);
  const container = useRef(null);
  const expandButton = useRef(null);
  const closeButton = useRef(null);
  const titleId = useId();
  const restoreFocus = useRef(false);
  const [fullscreen, setFullscreen] = useState(false);
  const navigation = useRef(null);
  const anchor = useViewportAnchor();
  const body = useRef(null);
  const gesture = useRef(null);
  useEffect(() => leadDraft.restore(), []);
  const currentSheet =
    d.questionnaires[product]?.sheet || definition?.sheets[0]?.key;
  const currentScroll = d.questionnaires[product]?.scroll?.[currentSheet] || 0;
  useEffect(() => {
    if (body.current && (fullscreen || window.matchMedia("(min-width: 961px)").matches)) {
      body.current.scrollTop = currentScroll;
    }
  }, [product, currentSheet, currentScroll, fullscreen]);
  const q = d.questionnaires[product] || initialQuestionnaire();
  const answers = q.answers;
  const sheets = activeSheets(product, answers);
  const index = Math.max(
    0,
    sheets.findIndex((s) => s.key === q.sheet),
  );
  const sheet = sheets[index];
  const data = answers[sheet.key] || {};
  function patchData(patch) {
    updateQuestionnaire(product, {
      answers: { ...answers, [sheet.key]: { ...data, ...patch } },
    });
  }
  function navigate(i) {
    if (i < 0 || i >= sheets.length) return;
    if (!fullscreen) anchor(navigation.current);
    const scroll = { ...q.scroll, [sheet.key]: body.current?.scrollTop || 0 };
    updateQuestionnaire(
      product,
      { sheet: sheets[i].key, scroll },
      { content: false },
    );
  }
  function openWorkspace() {
    const dialog = workspace.current;
    if (!dialog?.showModal || dialog.matches(":modal")) return;
    // Keep the same inputs mounted, including unfinished numeric edits.
    container.current.style.minBlockSize = `${container.current.offsetHeight}px`;
    dialog.removeAttribute("open");
    try {
      dialog.showModal();
    } catch {
      dialog.setAttribute("open", "");
      container.current.style.minBlockSize = "";
      return;
    }
    setFullscreen(true);
  }
  function closeWorkspace() {
    const dialog = workspace.current;
    if (!dialog?.matches(":modal")) return;
    dialog.close();
    dialog.setAttribute("open", "");
    container.current.style.minBlockSize = "";
    restoreFocus.current = true;
    setFullscreen(false);
  }
  useEffect(() => {
    if (fullscreen) closeButton.current?.focus({ preventScroll: true });
    else if (restoreFocus.current) {
      restoreFocus.current = false;
      expandButton.current?.focus({ preventScroll: true });
    }
  }, [fullscreen]);
  const errors = d.questionnaireErrors || {};
  const rowFields = sheet.outletFields;
  const rows = data.outlets || [{ id: "outlet-1" }];
  return (
    <div className="ql-content" ref={container}>
      <dialog
        open
        role={fullscreen ? undefined : "presentation"}
        aria-labelledby={fullscreen ? titleId : undefined}
        className="ql-workspace"
        ref={workspace}
        onCancel={(event) => {
          event.preventDefault();
          closeWorkspace();
        }}
      >
      {fullscreen && (
        <header className="ql-workspace__header">
          <div>
            <h2 id={titleId}>Опросный лист {definition.title}</h2>
            <small>Обязательных полей: <span className="ql-required-count">{requiredFieldCount(product, answers)}</span></small>
          </div>
          <button ref={closeButton} type="button" className="ql-workspace__close"
            aria-label="Свернуть опросный лист" onClick={closeWorkspace}>
            <span aria-hidden="true" />
          </button>
        </header>
      )}
      <nav ref={navigation} className="ql-nav" aria-label="Листы опросника">
        <label className="ql-section-select">
          <select
            aria-label="Раздел опросного листа"
            value={sheet.key}
            disabled={d.submitting}
            onChange={(event) =>
              navigate(sheets.findIndex((s) => s.key === event.target.value))
            }
          >
            {sheets.map((s) => (
              <option key={s.key} value={s.key}>
                {s.title}
              </option>
            ))}
          </select>
          <span className="faq__chevron" aria-hidden="true" />
        </label>
        <div className="ql-paging">
          <button
            type="button"
            aria-label="Предыдущий лист"
            disabled={index === 0 || d.submitting}
            onClick={() => navigate(index - 1)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5m6-6-6 6 6 6" />
            </svg>
            <span>Назад</span>
          </button>
          <span className="ql-page-count" aria-live="polite">
            {index + 1} из {sheets.length}
          </span>
          <button
            type="button"
            aria-label="Следующий лист"
            disabled={index === sheets.length - 1 || d.submitting}
            onClick={() => navigate(index + 1)}
          >
            <span>Далее</span>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14m-6-6 6 6-6 6" />
            </svg>
          </button>
        </div>
        {!fullscreen && q.enabled && (
          <button ref={expandButton} type="button" className="ql-workspace__open"
            onClick={openWorkspace} disabled={d.submitting}>
            На весь экран
          </button>
        )}
      </nav>
      <div
        className="ql-body"
        ref={body}
        onScroll={(e) => {
          if (!fullscreen && window.matchMedia("(max-width: 960px)").matches) return;
          const top = e.currentTarget.scrollTop;
          if (top !== (q.scroll?.[sheet.key] || 0))
            updateQuestionnaire(
              product,
              { sheet: sheet.key, scroll: { ...q.scroll, [sheet.key]: top } },
              { content: false },
            );
        }}
        onTouchCancel={() => {
          gesture.current = null;
        }}
        onTouchStart={(e) => {
          gesture.current = null;
          if (
            e.target.closest("input,select,textarea,button") ||
            e.touches.length !== 1 ||
            e.touches[0].clientX < 30 ||
            e.touches[0].clientX > window.innerWidth - 30
          )
            return;
          gesture.current = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY,
          };
        }}
        onTouchEnd={(e) => {
          const start = gesture.current;
          gesture.current = null;
          if (!start || !window.getSelection()?.isCollapsed) return;
          const dx = e.changedTouches[0].clientX - start.x,
            dy = e.changedTouches[0].clientY - start.y;
          if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 2)
            navigate(index + (dx < 0 ? 1 : -1));
        }}
      >
        <fieldset disabled={!q.enabled || d.submitting} className="ql-fields">
          <legend>{sheet.title}</legend>
          {product === "btp" && sheet.key === "common" && (
            <div className="ql-composition">
              <strong>Состав БТП — выберите хотя бы один раздел</strong>
              {definition.sheets
                .filter((s) => s.optional)
                .map((s) => (
                  <label key={s.key}>
                    <input
                      type="checkbox"
                      checked={
                        answers.selectedSections?.includes(s.key) || false
                      }
                      onChange={(e) => {
                        const selected = new Set(
                          answers.selectedSections || [],
                        );
                        if (e.target.checked) selected.add(s.key);
                        else selected.delete(s.key);
                        updateQuestionnaire(product, {
                          answers: {
                            ...answers,
                            selectedSections: [...selected],
                          },
                        });
                      }}
                    />
                    {s.title}
                  </label>
                ))}
              {errors["btp.common.selectedSections"] && (
                <p className="ql-error">
                  {errors["btp.common.selectedSections"]}
                </p>
              )}
            </div>
          )}
          {product === "bmk" && sheet.key === "loads" && (
            <p>
              Нужна хотя бы одна полезная нагрузка: отопление, вентиляция или
              обе нагрузки ГВС.
            </p>
          )}
          {sheet.fields
            .filter((f) => applicable(f, data))
            .map((f) => (
              <AnswerField
                key={f.key}
                field={
                  product === "bmk" &&
                  f.key === "pipes" &&
                  (blank(answers.loads?.dhw_max) ||
                    blank(answers.loads?.dhw_average))
                    ? { ...f, disabledOptions: ["Четырёхтрубная"] }
                    : f
                }
                value={data[f.key]}
                onChange={(value) => patchData({ [f.key]: value })}
                path={product + "." + sheet.key + "." + f.key}
                errors={errors}
                focusKey={d.questionnaireFocus}
              />
            ))}
          {rowFields && (
            <>
              <p>
                Для каждого выхода укажите мощность, расход или Ду. Полностью
                пустые строки не отправляются. Предел —{" "}
                {contract.limits.outlets} выходов.
              </p>
              {errors[product + "." + sheet.key + ".outlets"] && (
                <p className="ql-error">
                  {errors[product + "." + sheet.key + ".outlets"]}
                </p>
              )}
              {rows.map((row, i) => (
                <div className="ql-outlet" key={row.id}>
                  <div className="ql-outlet__heading">
                    <strong>Выход {i + 1}</strong>
                    <button
                      type="button"
                      disabled={rows.length === 1}
                      onClick={() =>
                        patchData({
                          outlets: rows.filter((r) => r.id !== row.id),
                        })
                      }
                    >
                      Удалить выход
                    </button>
                  </div>
                  {rowFields.map((f) => (
                    <AnswerField
                      key={f.key}
                      field={f}
                      value={row[f.key]}
                      onChange={(value) =>
                        patchData({
                          outlets: rows.map((r) =>
                            r.id === row.id ? { ...r, [f.key]: value } : r,
                          ),
                        })
                      }
                      path={
                        product +
                        "." +
                        sheet.key +
                        ".outlets." +
                        row.id +
                        "." +
                        f.key
                      }
                      errors={errors}
                      focusKey={d.questionnaireFocus}
                    />
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        window.confirm(
                          "Заменить балансировку подачи, обратки и некоммерческий учёт всех выходов настройками этого выхода? Мощность, расход и Ду сохранятся.",
                        )
                      )
                        patchData({
                          outlets: rows.map((r) => ({
                            ...r,
                            balance_supply: row.balance_supply || "",
                            balance_return: row.balance_return || "",
                            meter: row.meter || "",
                          })),
                        });
                    }}
                  >
                    Применить настройки этого выхода ко всем
                  </button>
                </div>
              ))}
              <button
                type="button"
                disabled={rows.length >= contract.limits.outlets}
                onClick={() =>
                  patchData({
                    outlets: [...rows, { id: crypto.randomUUID() }],
                  })
                }
              >
                Добавить выход
              </button>
            </>
          )}
        </fieldset>
      </div>
      </dialog>
    </div>
  );
}
