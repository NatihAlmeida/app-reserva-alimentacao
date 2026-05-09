import { useContext, useState } from 'react';
import {
  FaAward,
  FaCamera,
  FaCheckCircle,
  FaIdCard,
  FaLock,
  FaSave,
  FaUserCircle,
} from 'react-icons/fa';
import { AuthContext } from '../context/AuthContext';
import Header from '../components/UI/Header';

export default function Settings() {
  const { user, updateProfile, changePassword } = useContext(AuthContext);
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    profilePicture: user?.profilePicture || '',
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(profileForm);
    setProfileMessage('Perfil atualizado com sucesso.');
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('As senhas não conferem.');
      return;
    }

    const result = changePassword(passwordForm.currentPassword, passwordForm.newPassword);
    setPasswordMessage(result.message);

    if (result.success) {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  };

  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setProfileForm((current) => ({
        ...current,
        profilePicture: reader.result,
      }));
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <Header title="Configurações" />

      <main className="container-custom py-6 sm:py-8">
        <section className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <aside className="overflow-hidden rounded-[24px] bg-white shadow-xl">
            <div className="bg-primary-600 p-6 text-white sm:p-8">
              <div className="flex items-center gap-4">
                <ProfileAvatar
                  src={profileForm.profilePicture}
                  name={profileForm.name}
                  className="h-16 w-16"
                />
                <div>
                  <h1 className="text-2xl font-extrabold">Perfil do Usuário</h1>
                  <p className="mt-1 text-sm text-emerald-50">Gerencie suas informações</p>
                </div>
              </div>
            </div>

            <div className="space-y-4 p-5 sm:p-8">
              <InfoCard icon={<FaUserCircle />} label="Nome" value={user?.name || 'Estudante'} />
              <InfoCard icon={<FaIdCard />} label="E-mail" value={user?.email || 'estudante@escola.com'} />
              <InfoCard
                icon={<FaAward />}
                label="Tipo de Acesso"
                value={user?.role === 'admin' ? 'Administrador' : 'Aluno'}
                pill
              />
            </div>
          </aside>

          <div className="space-y-6">
            <form
              onSubmit={handleProfileSubmit}
              className="rounded-[24px] bg-white p-5 shadow-xl sm:p-7"
            >
              <h2 className="text-xl font-extrabold text-gray-900">Editar perfil</h2>

              <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-center">
                <ProfileAvatar
                  src={profileForm.profilePicture}
                  name={profileForm.name}
                  className="h-24 w-24"
                />
                <label className="inline-flex h-11 w-fit cursor-pointer items-center gap-2 rounded-full bg-primary-50 px-5 text-sm font-bold text-primary-700 transition hover:bg-primary-100">
                  <FaCamera />
                  Alterar foto
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handlePictureChange}
                  />
                </label>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-bold text-gray-600">Nome</span>
                  <input
                    type="text"
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm((current) => ({ ...current, name: e.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border-0 bg-gray-100 px-4 text-gray-800 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-primary-200"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-sm font-bold text-gray-600">E-mail</span>
                  <input
                    type="email"
                    value={profileForm.email}
                    onChange={(e) =>
                      setProfileForm((current) => ({ ...current, email: e.target.value }))
                    }
                    className="mt-2 h-12 w-full rounded-xl border-0 bg-gray-100 px-4 text-gray-800 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-primary-200"
                    required
                  />
                </label>
              </div>

              {profileMessage && (
                <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <FaCheckCircle />
                  {profileMessage}
                </p>
              )}

              <button
                type="submit"
                className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary-700 px-5 text-sm font-extrabold text-white transition hover:bg-primary-800 sm:w-auto"
              >
                <FaSave />
                Salvar perfil
              </button>
            </form>

            <form
              onSubmit={handlePasswordSubmit}
              className="rounded-[24px] bg-white p-5 shadow-xl sm:p-7"
            >
              <h2 className="flex items-center gap-2 text-xl font-extrabold text-gray-900">
                <FaLock className="text-primary-700" />
                Alterar senha
              </h2>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <PasswordInput
                  label="Senha atual"
                  value={passwordForm.currentPassword}
                  onChange={(value) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: value }))
                  }
                />
                <PasswordInput
                  label="Nova senha"
                  value={passwordForm.newPassword}
                  onChange={(value) =>
                    setPasswordForm((current) => ({ ...current, newPassword: value }))
                  }
                />
                <PasswordInput
                  label="Confirmar senha"
                  value={passwordForm.confirmPassword}
                  onChange={(value) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: value }))
                  }
                />
              </div>

              {passwordMessage && (
                <p className="mt-4 text-sm font-semibold text-primary-700">{passwordMessage}</p>
              )}

              <button
                type="submit"
                className="mt-6 h-12 w-full rounded-xl bg-primary-700 px-5 text-sm font-extrabold text-white transition hover:bg-primary-800 sm:w-auto"
              >
                Atualizar senha
              </button>
            </form>
          </div>
        </section>
      </main>
    </>
  );
}

function ProfileAvatar({ src, name, className }) {
  return (
    <div
      className={`${className} grid shrink-0 place-items-center overflow-hidden rounded-full bg-white text-primary-700 ring-4 ring-white/25`}
    >
      {src ? (
        <img src={src} alt={name || 'Perfil'} className="h-full w-full object-cover" />
      ) : (
        <FaUserCircle className="h-4/5 w-4/5" />
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, pill = false }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-gray-50 p-4">
      <div className="text-3xl text-primary-600">{icon}</div>
      <div className="min-w-0">
        <p className="text-sm text-gray-500">{label}</p>
        {pill ? (
          <span className="mt-1 inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
            {value}
          </span>
        ) : (
          <p className="truncate font-extrabold text-gray-900">{value}</p>
        )}
      </div>
    </div>
  );
}

function PasswordInput({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm font-bold text-gray-600">{label}</span>
      <input
        type="password"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 h-12 w-full rounded-xl border-0 bg-gray-100 px-4 text-gray-800 outline-none ring-2 ring-transparent transition focus:bg-white focus:ring-primary-200"
        required
      />
    </label>
  );
}
