import { useState } from 'react';
import { Link } from 'react-router-dom';
import PageNavigation from '../../components/PageNavigation';
import Seo from '../../components/Seo';
import { about, aboutPhotos, productionGallery } from '../../data/about';
import AboutPhotoViewer from './AboutPhotoViewer';

function Photo({ photo, onOpen, eager = false, sizes, className = '' }) {
  return <figure className={`about-photo ${className}`}>
    <button className="about-photo__open" type="button" onClick={onOpen}
      aria-label={`Увеличить фотографию: ${photo.caption}`} aria-haspopup="dialog">
      <img src={photo.page} srcSet={photo.srcSet} sizes={sizes}
        width={photo.width} height={photo.height} alt={photo.alt}
        loading={eager ? 'eager' : 'lazy'} decoding="async" />
      <span className="about-photo__hint" aria-hidden="true">Увеличить ↗</span>
    </button>
    <figcaption>{photo.caption}</figcaption>
  </figure>;
}
function Signature({ person }) {
  return <p className="about-page__signature"><strong>{person.name}</strong><span>{person.role}</span></p>;
}
export default function AboutPage() {
  const [viewer, setViewer] = useState(null);
  const single = photo => () => setViewer({ photos: [photo], index: 0 });
  return <main className="about-page">
    <Seo {...about.seo} path="/about" />
    <div className="container">
      <PageNavigation backLabel="На главную" backTo="/"
        breadcrumbItems={[{ label: 'Главная', to: '/' }, { label: about.title }]} />
      <section className="about-page__intro" aria-labelledby="about-title">
        <header className="about-page__heading"><h1 id="about-title">{about.title}</h1><p>{about.history}.</p></header>
        <div className="about-page__director">
          <Photo photo={aboutPhotos.director} onOpen={single(aboutPhotos.director)} eager
            sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 960px) 440px, 460px" />
          <div className="about-page__address">{about.director.paragraphs.map(text => <p key={text}>{text}</p>)}<Signature person={about.director} /></div>
        </div>
      </section>
      <section className="about-page__section about-page__team" aria-labelledby="about-team-title">
        <div><h2 id="about-team-title">{about.team.title}</h2><p>{about.team.intro}.</p>
          <ul className="about-page__departments">{about.team.departments.map(([name, text]) => <li key={name}><strong>{name}</strong> — {text}.</li>)}</ul>
        </div>
        <Photo photo={aboutPhotos.team} onOpen={single(aboutPhotos.team)} className="about-photo--vertical"
          sizes="(max-width: 640px) 220px, (max-width: 960px) 260px, 300px" />
      </section>
      <section className="about-page__section" aria-labelledby="about-production-title">
        <div className="about-page__production-lead">
          <div><h2 id="about-production-title">{about.production.title}</h2><blockquote className="about-page__quote">{about.production.quote}</blockquote><Signature person={about.production} /></div>
          <Photo photo={aboutPhotos.production} onOpen={single(aboutPhotos.production)} className="about-photo--vertical"
            sizes="(max-width: 640px) 220px, (max-width: 960px) 260px, 300px" />
        </div>
        <ol className="about-page__process">{about.production.stages.map(stage => <li key={stage.title}><h3>{stage.title}</h3><p>{stage.text}</p></li>)}</ol>
        <p className="about-page__scope">{about.production.scope}</p>
        <div className="about-page__gallery">{productionGallery.map((photo, index) => <Photo key={photo.id} photo={photo}
          onOpen={() => setViewer({ photos: productionGallery, index })} sizes="(max-width: 640px) 160px, (max-width: 960px) 180px, 220px" />)}</div>
      </section>
      <section className="about-page__section about-page__anniversary" aria-labelledby="about-anniversary-title">
        <div><h2 id="about-anniversary-title">{about.anniversary.title}</h2><p>{about.anniversary.text}.</p></div>
        <Photo photo={aboutPhotos.anniversary} onOpen={single(aboutPhotos.anniversary)} sizes="(max-width: 960px) calc(100vw - 32px), 700px" />
      </section>
      <section className="about-page__section about-page__contact" aria-labelledby="about-contact-title">
        <h2 id="about-contact-title">{about.contact.title}</h2><p>{about.contact.text}.</p><p>{about.contact.geography}.</p>
        <Link className="button button--primary" to="/#contacts" state={{ entryScroll: 'contacts-direct' }}>{about.contact.button}</Link>
      </section>
    </div>
    {viewer && <AboutPhotoViewer photos={viewer.photos} initialIndex={viewer.index} onClose={() => setViewer(null)} />}
  </main>;
}
