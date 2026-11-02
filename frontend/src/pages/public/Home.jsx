import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowDown,
  ArrowRight,
  Check,
  CheckCheck,
  ClipboardList,
  Heart,
  MessageCircle,
  Stethoscope,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../routes/paths';

const stages = [
  {
    label: 'Antes',
    title: 'Uma conversa começa com preparo.',
    text: 'Organize o motivo da consulta, seus sintomas e as perguntas que você não quer esquecer.',
    icon: ClipboardList,
    tag: 'Preparação da consulta',
    heading: 'O que você quer conversar?',
    items: ['Como tenho me sentido', 'Minhas dúvidas e perguntas', 'Medicamentos em uso'],
    note: 'Um lugar para organizar o que importa.',
  },
  {
    label: 'Durante',
    title: 'Mais contexto para o cuidado.',
    text: 'A proposta é aproximar o que o paciente sente das informações que ajudam o profissional no atendimento.',
    icon: MessageCircle,
    tag: 'Resumo para o atendimento',
    heading: 'Uma conversa com mais contexto',
    items: ['Motivo da consulta', 'Contexto e sintomas relatados', 'Pontos para conversar'],
    note: 'Informação organizada para apoiar o diálogo.',
  },
  {
    label: 'Depois',
    title: 'O cuidado continua na rotina.',
    text: 'Orientações, medicamentos e próximos passos fazem parte de uma jornada que vai além da consulta.',
    icon: Heart,
    tag: 'Continuidade do cuidado',
    heading: 'Próximos passos, mais claros',
    items: [
      'Orientações do profissional',
      'Cuidados para o dia a dia',
      'Informações sobre o retorno',
    ],
    note: 'Uma visão do caminho que queremos construir.',
  },
];
const questions = [
  [
    'O que é o MedTrack?',
    'É um projeto para aproximar pacientes e profissionais por meio da organização das informações da consulta. A proposta reúne preparação, atendimento e acompanhamento em uma mesma jornada.',
  ],
  [
    'Como faço para criar minha conta?',
    'Escolha “Sou paciente” ou “Sou médico parceiro”. Você vai para o cadastro com o perfil selecionado. Se já tem conta, use Login no topo da página.',
  ],
  [
    'Já tenho cadastro. Preciso criar outro?',
    'Não. Entre com seu e-mail e senha. Na opção “Meu cadastro”, você pode completar ou atualizar seus dados.',
  ],
  [
    'O MedTrack oferece diagnósticos?',
    'Não. O MedTrack organiza informações e não substitui a avaliação de um profissional de saúde.',
  ],
];

function JourneyPreview({ stage }) {
  const Icon = stage.icon;
  return (
    <div className="home-preview" key={stage.label}>
      <div className="home-preview__top">
        <span className="home-preview__dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span>Uma jornada de cuidado</span>
        <ClipboardList size={16} aria-hidden="true" />
      </div>
      <div className="home-preview__body">
        <div className="home-preview__label">
          <span className="home-preview__icon">
            <Icon size={24} aria-hidden="true" />
          </span>
          <span>MEDTRACK / {stage.label.toUpperCase()}</span>
        </div>
        <span className="home-preview__tag">{stage.tag}</span>
        <h3>{stage.heading}</h3>
        <ul>
          {stage.items.map((item) => (
            <li key={item}>
              <span>
                <Check size={15} aria-hidden="true" />
              </span>
              {item}
            </li>
          ))}
        </ul>
        <div className="home-preview__note">
          <CheckCheck size={20} aria-hidden="true" />
          <p>{stage.note}</p>
        </div>
      </div>
      <div className="home-preview__foot">
        <span className="home-live-dot" aria-hidden="true" /> Demonstração ilustrativa da proposta
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const [active, setActive] = useState(0);
  useEffect(() => {
    document.title = 'MedTrack · O cuidado começa antes da consulta';
  }, []);
  const stage = stages[active];
  return (
    <div className="home-page">
      <section className="home-hero home-container" aria-labelledby="home-title">
        <div className="home-hero__copy">
          <span className="home-eyebrow">
            <span className="home-live-dot" aria-hidden="true" /> CONECTANDO PESSOAS E CUIDADO
          </span>
          <h1 id="home-title">
            O cuidado começa <em>antes da consulta.</em>
          </h1>
          <p className="home-lead">
            Suas dúvidas, sua história, seus próximos passos. Uma jornada pensada para aproximar
            pacientes e profissionais de saúde.
          </p>
          <div className="home-actions">
            <Link className="btn btn-primary home-button" to="/cadastro?perfil=patient">
              Sou paciente <ArrowRight size={19} aria-hidden="true" />
            </Link>
            <Link className="home-text-link" to="/cadastro?perfil=doctor">
              Sou médico parceiro <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
          <div className="home-hero__caption">
            <span className="home-mini-icon">
              <Heart size={16} aria-hidden="true" />
            </span>{' '}
            Mais espaço para o que realmente importa: você.
          </div>
        </div>
        <div className="home-hero__visual">
          <div className="home-orbit home-orbit--one" aria-hidden="true" />
          <div className="home-orbit home-orbit--two" aria-hidden="true" />
          <span className="home-floating-note">
            <span>
              <Stethoscope size={18} aria-hidden="true" />
            </span>{' '}
            Pessoas no centro.
            <br />
            <strong>Cuidado em conexão.</strong>
          </span>
          <JourneyPreview stage={stage} />
          <div
            className="home-preview-switch"
            role="group"
            aria-label="Explore as etapas da jornada"
          >
            {stages.map((item, index) => (
              <button
                type="button"
                key={item.label}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              >
                <span>0{index + 1}</span>
                {item.label}
              </button>
            ))}
          </div>
        </div>
        <a className="home-discover" href="#como-funciona">
          <ArrowDown size={16} aria-hidden="true" /> Conheça a proposta
        </a>
      </section>

      <div className="home-principles" aria-label="Princípios do MedTrack">
        <div className="home-container">
          <span>
            <ClipboardList size={19} aria-hidden="true" /> Informação com contexto
          </span>
          <span>
            <MessageCircle size={19} aria-hidden="true" /> Espaço para suas dúvidas
          </span>
          <span>
            <Heart size={19} aria-hidden="true" /> Pessoas em primeiro lugar
          </span>
        </div>
      </div>

      <section
        id="como-funciona"
        className="home-journey home-container home-section"
        aria-labelledby="journey-title"
      >
        <div className="home-section-heading">
          <span className="home-eyebrow">UM OLHAR PARA TODA A JORNADA</span>
          <h2 id="journey-title">
            Uma consulta é só uma parte <em>do cuidado.</em>
          </h2>
          <p>Antes, durante e depois: conheça o caminho que orienta o MedTrack.</p>
        </div>
        <div className="home-journey__grid">
          <div className="home-journey__steps" role="group" aria-label="Etapas do cuidado">
            {stages.map((item, index) => (
              <button
                type="button"
                key={item.label}
                className={active === index ? 'is-active' : ''}
                aria-pressed={active === index}
                onClick={() => setActive(index)}
              >
                <span className="home-step-number">0{index + 1}</span>
                <span>
                  <span className="home-step-label">
                    {item.label} {index === 1 ? 'a' : 'da'} consulta
                  </span>
                  <strong>{item.title}</strong>
                  {active === index && <span className="home-step-description">{item.text}</span>}
                </span>
                <ArrowRight size={18} aria-hidden="true" />
              </button>
            ))}
          </div>
          <div className="home-journey__detail" aria-live="polite" aria-atomic="true">
            <span className="home-journey__detail-icon">
              {active === 0 ? (
                <ClipboardList size={40} />
              ) : active === 1 ? (
                <MessageCircle size={40} />
              ) : (
                <Heart size={40} />
              )}
            </span>
            <span className="home-eyebrow">
              {stage.label.toUpperCase()} {active === 1 ? 'A' : 'DA'} CONSULTA
            </span>
            <h3>{stage.title}</h3>
            <p>{stage.text}</p>
            <div className="home-small-note">
              Um projeto em evolução, feito para organizar informações e aproximar pessoas.
            </div>
          </div>
        </div>
      </section>

      <section
        id="para-voce"
        className="home-audiences home-section"
        aria-labelledby="audiences-title"
      >
        <div className="home-container">
          <div className="home-section-heading">
            <span className="home-eyebrow">DOIS OLHARES. UM MESMO PROPÓSITO.</span>
            <h2 id="audiences-title">
              Qual é o seu lugar <em>nessa jornada?</em>
            </h2>
          </div>
          <div className="home-audiences__grid">
            <article className="home-audience home-audience--patient">
              <span className="home-audience__icon">
                <UserRound size={28} aria-hidden="true" />
              </span>
              <span className="home-eyebrow">PARA PACIENTES</span>
              <h3>
                Sua saúde tem uma história.
                <br />
                Ela merece ser ouvida.
              </h3>
              <p>
                Comece criando seu perfil e conte um pouco sobre você. Seus dados podem ser
                completados e atualizados quando precisar.
              </p>
              <ul>
                <li>
                  <Check size={17} aria-hidden="true" /> Um cadastro que respeita sua identidade
                </li>
                <li>
                  <Check size={17} aria-hidden="true" /> Seus dados, sempre atualizáveis
                </li>
                <li>
                  <Check size={17} aria-hidden="true" /> Acesso à sua área de paciente
                </li>
              </ul>
              <Link className="btn btn-primary home-button" to="/cadastro?perfil=patient">
                Cadastrar como paciente <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
            <article className="home-audience home-audience--doctor">
              <span className="home-audience__icon">
                <Stethoscope size={28} aria-hidden="true" />
              </span>
              <span className="home-eyebrow">PARA PROFISSIONAIS</span>
              <h3>
                Conexões que dão
                <br />
                mais sentido ao cuidado.
              </h3>
              <p>
                Cadastre-se como médico parceiro, apresente sua especialidade e faça parte da
                proposta de uma jornada com mais contexto.
              </p>
              <ul>
                <li>
                  <Check size={17} aria-hidden="true" /> Perfil com especialidade, CRM e UF
                </li>
                <li>
                  <Check size={17} aria-hidden="true" /> Informações profissionais em um só lugar
                </li>
                <li>
                  <Check size={17} aria-hidden="true" /> Acesso à sua área de médico
                </li>
              </ul>
              <Link className="btn home-button home-button--light" to="/cadastro?perfil=doctor">
                Ser médico parceiro <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section
        id="duvidas"
        className="home-faq home-container home-section"
        aria-labelledby="faq-title"
      >
        <div className="home-section-heading">
          <span className="home-eyebrow">VAMOS CONVERSAR?</span>
          <h2 id="faq-title">
            Antes de começar,
            <br />
            <em>tire suas dúvidas.</em>
          </h2>
          <p>Algumas respostas para conhecer melhor o projeto.</p>
        </div>
        <div className="home-faq__items">
          {questions.map(([question, answer]) => (
            <details key={question}>
              <summary>
                {question}
                <span className="home-faq__plus" aria-hidden="true">
                  +
                </span>
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="home-final home-container" aria-labelledby="final-title">
        <div>
          <span className="home-eyebrow">O PRIMEIRO PASSO É SE CONECTAR</span>
          <h2 id="final-title">
            Vamos cuidar dessa
            <br />
            <em>jornada, juntos?</em>
          </h2>
        </div>
        <div>
          <Link
            to={user ? homeFor(user) : '/cadastro?perfil=patient'}
            className="btn btn-primary home-button"
          >
            {user ? 'Acessar minha área' : 'Criar minha conta'}
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <p>
            {user ? (
              'Seu espaço no MedTrack está aqui.'
            ) : (
              <>
                Já faz parte? <Link to="/login">Faça login</Link>
              </>
            )}
          </p>
        </div>
      </section>
    </div>
  );
}
