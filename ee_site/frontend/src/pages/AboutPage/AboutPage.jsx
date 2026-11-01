import { Link } from "react-router-dom";
import PageNavigation from "../../components/PageNavigation";
import Seo from "../../components/Seo";
import { about, directorPhoto } from "../../data/about";
import { aboutGallery } from "../../data/aboutGallery";

export default function AboutPage() {
  return (
    <main className="about-page">
      <Seo {...about.seo} path="/about" />
      <div className="container">
        <PageNavigation
          backLabel="На главную"
          backTo="/"
          breadcrumbItems={[
            { label: "Главная", to: "/" },
            { label: about.title },
          ]}
        />
        <section className="about-page__intro" aria-labelledby="about-title">
          <header className="about-page__heading">
            <h1 id="about-title">{about.title}</h1>
          </header>
          <div className="about-page__director">
            <img
              className="about-page__portrait"
              src={directorPhoto.page}
              srcSet={directorPhoto.srcSet}
              sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 960px) 440px, 500px"
              width={directorPhoto.width}
              height={directorPhoto.height}
              alt={directorPhoto.alt}
              decoding="async"
            />
            <div className="about-page__address">
              {about.director.paragraphs.map((text) => (
                <p key={text}>{text}</p>
              ))}
              <p className="about-page__signature">{about.director.role}</p>
            </div>
          </div>
        </section>
        <section
          className="about-page__gallery-section"
          aria-label="Фотографии компании"
        >
          <ol className="about-page__gallery">
            {aboutGallery.map((photo) => (
              <li
                key={photo.number}
                data-photo={photo.number}
                style={{ "--photo-ratio": photo.width / photo.height }}
              >
                <img
                  src={photo.src}
                  srcSet={photo.srcSet}
                  sizes="(max-width: 640px) calc(100vw - 32px), (max-width: 960px) 45vw, 40vw"
                  width={photo.width}
                  height={photo.height}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                />
              </li>
            ))}
          </ol>
        </section>
        <section
          className="about-page__contact"
          aria-labelledby="about-contact-title"
        >
          <h2 id="about-contact-title">{about.contact.title}</h2>
          <p>{about.contact.text}.</p>
          <Link
            className="button button--primary"
            to="/#contacts"
            state={{ entryScroll: "contacts-direct" }}
          >
            {about.contact.button}
          </Link>
        </section>
      </div>
    </main>
  );
}
