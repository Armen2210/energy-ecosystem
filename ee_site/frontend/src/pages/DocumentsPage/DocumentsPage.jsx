import PageNavigation from '../../components/PageNavigation';
import Seo from '../../components/Seo';
import { formatDocumentSize, populatedDocumentCategories } from '../../data/documents';

export default function DocumentsPage() {
  return <main className="documents-page">
    <Seo title="Документы — Энергоэффект" path="/documents"
      description="Опросные листы БМК, БТП, ВНС и ПНС, сертификаты партнёрства и результаты СОУТ ООО «Энергоэффект»: скачать бланки или открыть PDF." />
    <div className="container">
      <PageNavigation backLabel="На главную" backTo="/#footer-documents"
        breadcrumbItems={[{ label: 'Главная', to: '/' }, { label: 'Документы' }]} />
      <header className="documents-page__heading">
        <h1>Документы</h1>
        <p>Опросные листы, сертификаты и другие документы компании.</p>
      </header>
      {populatedDocumentCategories().map(category => <section className="documents-page__category"
        key={category.id} aria-labelledby={`documents-${category.id}`}>
        <h2 id={`documents-${category.id}`}>{category.title}</h2>
        {category.description && <p className="documents-page__description">{category.description}</p>}
        <ul className="documents-page__list">
          {category.documents.map(document => <li className="documents-page__document" key={document.id}>
            <div>
              <h3>{document.title}</h3>
              {document.description && <p className="documents-page__document-description">{document.description}</p>}
            </div>
            <ul className="documents-page__files">
              {document.files.map(file => {
                const opens = file.behavior === 'open';
                const formatLabel = file.format === 'xlsx' ? 'Excel' : file.format.toUpperCase();
                const action = `${opens ? 'Открыть' : 'Скачать'} ${formatLabel}`;
                const descriptionId = `${document.id}-${file.format}`;
                return <li key={file.url}>
                  <a className="documents-page__file" href={file.url}
                    download={opens ? undefined : ''} target={opens ? '_blank' : undefined}
                    rel={opens ? 'noopener noreferrer' : undefined}
                    aria-label={`${action} — ${document.title}${opens ? ', в новой вкладке' : ''}`}
                    aria-describedby={`${file.purpose ? `${descriptionId}-purpose ` : ''}${descriptionId}-meta`}>
                    <span className="documents-page__action">{action}</span>
                    {file.purpose && <span className="documents-page__file-meta" id={`${descriptionId}-purpose`}>{file.purpose}</span>}
                    <span className="documents-page__file-meta" id={`${descriptionId}-meta`}>
                      {file.format.toUpperCase()} · {formatDocumentSize(file.sizeBytes)}{opens && ' · в новой вкладке'}
                    </span>
                  </a>
                </li>;
              })}
            </ul>
          </li>)}
        </ul>
      </section>)}
    </div>
  </main>;
}
