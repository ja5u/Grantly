import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, FileCheck2, FileUp, LockKeyhole } from 'lucide-react';
import type { Profile } from './domain';
import { useStore } from './store';

type Field = { key: Exclude<keyof Profile, 'documents'>; label: string; help?: string; choices?: string[]; max?: number; min?: number };
const yesNo = ['Yes', 'No'];
const fields: Field[] = [
  { key: 'level', label: 'Education level', choices: ['School', 'Diploma', 'Vocational', 'Undergraduate', 'Postgraduate', 'Doctoral', 'Other'], help: 'Find awards for your current stage of study.' },
  { key: 'course', label: 'Course or class', help: 'Use a broad subject such as Engineering, or enter your class.' },
  { key: 'state', label: 'State or union territory', help: 'Some scholarships have residence requirements.' },
  { key: 'category', label: 'Category', choices: ['General', 'SC', 'ST', 'OBC', 'EWS', 'Other'], help: 'Some awards are reserved for particular categories.' },
  { key: 'income', label: 'Annual family income (₹)', min: 0, help: 'Used to check income limits for need-based aid.' },
  { key: 'marks', label: 'Last exam marks (%)', min: 0, max: 100 },
  { key: 'year', label: 'Year of study', min: 1, max: 12 },
  { key: 'gender', label: 'Gender', choices: ['Female', 'Male', 'Other'] },
  { key: 'disability', label: 'Disability status', choices: yesNo },
  { key: 'minority', label: 'Minority community', choices: yesNo },
  { key: 'percentile', label: 'Class XII board percentile', min: 0, max: 100, help: 'Use the percentile from your board, when known.' },
  { key: 'regular', label: 'Attending a regular course?', choices: yesNo },
  { key: 'aid', label: 'Receiving other aid or fee reimbursement?', choices: yesNo },
  { key: 'gap', label: 'Study gap after Class XII?', choices: yesNo },
];

export function ProfilePage({ onboarding }: { onboarding: boolean }) {
  const store = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<Profile>(store.workspace.profile ?? { documents: [] });
  const [review, setReview] = useState(false);
  const [imported, setImported] = useState(false);
  const [importMessage, setImportMessage] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const importRun = useRef(0);
  useEffect(() => () => { importRun.current++; }, []);

  async function importFile(file: File, filePassword = password) {
    const run = ++importRun.current;
    setProgress(0);
    setImportMessage('');
    setPassword('');
    try {
      const { readIncomeCertificate } = await import('./parsePdf');
      const extracted = await readIncomeCertificate(file, filePassword, value => {
        if (run === importRun.current) setProgress(value);
      });
      if (run !== importRun.current) return;
      setForm(old => ({ ...old, income: extracted.income, documents: [...new Set([...old.documents, ...extracted.documents ?? []])] }));
      setImported(true);
      setImportMessage('PDF released. Review the suggested income before saving.');
    } catch (error) {
      if (run !== importRun.current) return;
      if (error instanceof Error && error.name === 'PasswordException') {
        setShowPassword(true);
        setImportMessage('This PDF is password protected. Enter its password and select the file again.');
      } else {
        setImportMessage(error instanceof Error ? error.message : 'Could not read this PDF. You can fill the form manually.');
      }
    } finally { if (run === importRun.current) setProgress(null); }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!review) { setReview(true); return; }
    store.saveProfile(form);
    navigate('/discover');
  }

  return <div className="narrow page"><div className="eyebrow">Your workspace / {onboarding ? 'Onboarding' : 'Profile'}</div>
    <h1>{review ? 'Review your profile' : onboarding ? 'Build your student profile' : 'Your student profile'}</h1>
    <p className="lede">A few details help Grantly explain which scholarship rules you match. Leave a field blank when you are unsure.</p>
    {!review && <section className="card upload"><FileUp size={27}/><div><h2>Start with an income certificate</h2><p>Use a PDF to suggest annual income, or fill in the form below. Processing happens on this device.</p>
      {showPassword && <label>PDF password<input type="password" autoComplete="off" value={password} onChange={event => setPassword(event.target.value)}/></label>}
      <div className="actions"><label className="button secondary file-control">Choose PDF<input type="file" accept=".pdf,application/pdf" disabled={progress !== null} onChange={event => { const file = event.target.files?.[0]; event.target.value = ''; if (file) void importFile(file); }}/></label>
      <button className="button secondary" disabled={progress !== null} onClick={async () => {
        try {
          const response = await fetch(import.meta.env.BASE_URL + 'sample-income.pdf');
          if (!response.ok) throw new Error();
          await importFile(new File([await response.blob()], 'sample-income.pdf'), '');
        } catch { setImportMessage('Could not load the sample. Please try again.'); }
      }}>Try a sample document</button>
      <a className="button text" href="#profile-fields">Fill manually</a></div>
      {progress !== null && <p role="status">Reading PDF… {progress}%</p>}{importMessage && <p role="status">{importMessage}</p>}
    </div></section>}
    <form className="card form-card" onSubmit={submit} id="profile-fields">
      <div className="section-title"><div><div className="eyebrow">{review ? 'Step 02' : 'Step 01'}</div><h2>{review ? 'Confirm these details' : 'Tell us about your studies'}</h2></div><LockKeyhole size={20}/></div>
      <div className="fields">{fields.map((field, index) => {
        if (review && form[field.key] === undefined) return null;
        const value = form[field.key] ?? '';
        const update = (raw: string) => {
          setForm({ ...form, [field.key]: raw === '' ? undefined : field.min !== undefined ? Number(raw) : raw });
          if (field.key === 'income') setImported(false);
        };
        return <label key={field.key}>{field.label}{field.key === 'income' && imported && <small className="pill matched"><FileCheck2 size={13}/> From PDF · check value</small>}
          {field.choices ? <select value={value} onChange={event => update(event.target.value)}><option value="">Select or leave blank</option>{field.choices.map(choice => <option key={choice}>{choice}</option>)}</select>
          : <input type={field.min === undefined ? 'text' : 'number'} min={field.min} max={field.max} step={field.key === 'marks' || field.key === 'percentile' ? 'any' : undefined} value={value} onChange={event => update(event.target.value)}/>}
          {field.help && <small>{field.help}</small>}{!field.help && index >= 5 && <small>Optional</small>}</label>;
      })}</div>
      {review && !fields.some(field => form[field.key] !== undefined) && <p>All fields are blank. You can still browse schemes and complete your profile later.</p>}
      <div className="actions">{review && <button type="button" className="button secondary" onClick={() => setReview(false)}>Back to fields</button>}
        <button className="button primary">{review ? 'See my scholarships' : 'Review profile'}<ArrowRight size={17}/></button></div>
    </form>
    {!onboarding && <section className="card form-card"><h2>Local data</h2><p>Your profile and application progress are stored in this browser.</p>
      {store.mode === 'demo' ? <button className="button secondary" onClick={() => { if (confirm('Reset fictional demo data?')) { store.resetDemo(); navigate('/discover'); } }}>Reset demo</button>
      : <button className="button secondary" onClick={() => { if (confirm('Clear your profile and application history on this device?')) { store.clearReal(); navigate('/'); } }}>Clear my data</button>}
      <Link className="button text" to="/discover">Back to Discover</Link></section>}
  </div>;
}
