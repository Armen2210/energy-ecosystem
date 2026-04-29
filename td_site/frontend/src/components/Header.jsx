function Header() {
  return (
    <header className="header">
      <div className="container header__inner">
        <div className="logo">ТД Энергоэффект</div>

        <nav className="nav">
          <a href="/">Главная</a>
          <a href="/about">О компании</a>
          <a href="/supply">Поставка</a>
          <a href="/directions">Направления</a>
          <a href="/cases">Кейсы</a>
          <a href="/contacts">Контакты</a>
        </nav>
      </div>
    </header>
  )
}

export default Header