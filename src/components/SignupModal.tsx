import React, { useState } from 'react';
import { X, User, Mail, Lock, MapPin, Sparkles, CheckCircle2, ShieldCheck, LogOut, Database } from 'lucide-react';
import {
  registerStargazerInSupabase,
  loginStargazerInSupabase,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabase';

export interface StargazerUser {
  id: string;
  name: string;
  email: string;
  location: string;
  avatar: string;
  honor: number;
  registeredAt: number;
  rankTitle?: string;
  stamps?: string[];
  dbSource?: 'supabase' | 'local-mirror';
}

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: StargazerUser | null;
  onAuthSuccess: (user: StargazerUser) => void;
  onSignOut: () => void;
}

const AVATARS = ['🌸', '🌙', '🦉', '🏮', '🔭', '⭐', '🪐', '☄️'];

export const SignupModal: React.FC<SignupModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onAuthSuccess,
  onSignOut,
}) => {
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('Kyoto, JP');
  const [avatar, setAvatar] = useState('🌸');
  const [prefillDemo, setPrefillDemo] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (!isLoginMode) {
      if (cleanName.length < 2) {
        setError('Please enter a Stargazer Name (at least 2 characters).');
        return;
      }
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) {
        setError('Please provide a valid celestial correspondence email.');
        return;
      }
      if (password.length < 4) {
        setError('Secret password code must be at least 4 characters.');
        return;
      }

      setIsSubmitting(true);
      try {
        const { row, source } = await registerStargazerInSupabase({
          name: cleanName,
          email: cleanEmail,
          password,
          location: location.trim() || 'Dark-Sky Sanctuary',
          avatar,
          prefillDemo,
        });

        const newUser: StargazerUser = {
          id: row.id,
          name: row.name,
          email: row.email,
          location: row.location,
          avatar: row.avatar,
          honor: row.honor_xp,
          registeredAt: new Date(row.registered_at).getTime() || Date.now(),
          rankTitle: row.rank_title,
          stamps: row.stamps,
          dbSource: source,
        };

        localStorage.setItem('tsukuyomi_user', JSON.stringify(newUser));
        localStorage.setItem('tw_uid', newUser.id);

        // Pre-fill demo collection in tw_db if requested
        if (prefillDemo) {
          try {
            const dbStr = localStorage.getItem('tw_db') || '{}';
            const db = JSON.parse(dbStr);
            db['players/' + newUser.id] = {
              name: newUser.name,
              loc: newUser.location,
              av: newUser.avatar,
              pts: newUser.honor,
              n: 14,
              nc: 9,
              stamps: row.stamps,
            };
            localStorage.setItem('tw_db', JSON.stringify(db));
          } catch {
            // Ignore fallback storage issues
          }
        }

        setSuccessMsg(
          `Welcome, Stargazer ${newUser.name}! Stored in ${
            source === 'supabase' ? 'Supabase Cloud (`stargazer_users`)' : 'Stargazer DB (`stargazer_users`)'
          }.`
        );
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(newUser);
          onClose();
        }, 650);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err?.message || 'Unable to register Stargazer profile.');
      }
    } else {
      // Login mode
      if (!cleanEmail) {
        setError('Please enter your email.');
        return;
      }

      setIsSubmitting(true);
      try {
        const { row, source } = await loginStargazerInSupabase({
          email: cleanEmail,
          password,
        });

        const loggedUser: StargazerUser = {
          id: row.id,
          name: row.name,
          email: row.email,
          location: row.location,
          avatar: row.avatar,
          honor: row.honor_xp,
          registeredAt: new Date(row.registered_at).getTime() || Date.now(),
          rankTitle: row.rank_title,
          stamps: row.stamps,
          dbSource: source,
        };

        localStorage.setItem('tsukuyomi_user', JSON.stringify(loggedUser));
        localStorage.setItem('tw_uid', loggedUser.id);

        setSuccessMsg(`Greetings, Stargazer ${loggedUser.name}! Authenticated via stargazer_users.`);
        setTimeout(() => {
          setIsSubmitting(false);
          onAuthSuccess(loggedUser);
          onClose();
        }, 650);
      } catch (err: any) {
        setIsSubmitting(false);
        setError(err?.message || 'Unable to sign in to your Stargazer account.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-[#0c1017] border border-[#c9a24a]/50 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
        {/* Torii Decorative Top Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#e0231c] via-[#c9a24a] to-[#e0231c]" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#78837c] hover:text-[#dfe7e0] p-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {currentUser ? (
          /* Profile view if already logged in */
          <div className="text-center space-y-5">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#18202c] border-2 border-[#c9a24a] flex items-center justify-center text-4xl shadow-lg shadow-[#c9a24a]/20">
              {currentUser.avatar}
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h3 className="font-celestial text-2xl font-bold text-white tracking-wide">
                  {currentUser.name}
                </h3>
                <span className="text-[10px] font-japanese uppercase px-2 py-0.5 rounded border border-[#e0231c] text-[#e0231c] bg-[#e0231c]/10">
                  武士
                </span>
              </div>
              <p className="text-xs text-[#c9a24a] mt-1 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span>{currentUser.location}</span>
                <span className="text-[#78837c] mx-1">•</span>
                <span>{currentUser.honor} Honor XP</span>
              </p>
              <p className="text-xs text-[#78837c] mt-0.5">{currentUser.email}</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 text-left space-y-2 text-xs text-[#aab4ad]">
              <div className="flex justify-between">
                <span>Stargazer Rank:</span>
                <span className="text-[#c9a24a] font-bold">
                  {currentUser.honor >= 1500 ? 'Constellation Keeper' : currentUser.honor >= 500 ? 'Night Wanderer' : 'Star Seeker'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Scroll Security:</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Authenticated
                </span>
              </div>
              <div className="flex justify-between">
                <span>Database Table:</span>
                <span className="text-[#c9a24a] font-mono flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  public.stargazer_users ({isSupabaseConfigured ? 'Supabase Cloud' : 'Local Mirror'})
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#c9a24a] text-[#05070a] font-bold text-xs uppercase tracking-wider hover:bg-[#d8b056] transition-colors cursor-pointer"
              >
                Enter Temple
              </button>
              <button
                onClick={async () => {
                  if (supabase) {
                    try {
                      await supabase.auth.signOut();
                    } catch {
                      // ignore
                    }
                  }
                  onSignOut();
                  onClose();
                }}
                className="py-2.5 px-4 rounded-xl bg-red-950/40 text-red-400 border border-red-800/50 hover:bg-red-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        ) : (
          /* Sign Up Form */
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e0231c]/10 border border-[#e0231c]/30 text-[#e0231c] text-[11px] font-japanese uppercase tracking-widest mb-2">
                <span>月読の門 • Stargazer Sanctuary</span>
              </div>
              <h2 className="font-celestial text-2xl font-bold text-white tracking-wide">
                {isLoginMode ? 'Enter the Dojo' : 'Register Your Stargazer Scroll'}
              </h2>
              <p className="text-xs text-[#aab4ad] mt-1">
                {isLoginMode
                  ? 'Access your celestial catalog, astronomical stamps, and leaderboard rank.'
                  : 'Join the community of night watchers, unlock the Star Collector game, and earn Honor Points.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/50 border border-red-500/50 text-red-300 text-xs flex items-center gap-2">
                <span className="text-sm">⚠️</span>
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/50 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLoginMode && (
                <div>
                  <label className="block text-xs font-medium text-[#dfe7e0] mb-1">
                    Stargazer Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-2.5 w-4 h-4 text-[#78837c]" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Master Kenshin, Aiko Mori"
                      maxLength={32}
                      className="w-full pl-9 pr-3 py-2 bg-[#06080d] border border-white/10 rounded-xl text-xs text-white placeholder-[#78837c] focus:outline-none focus:border-[#c9a24a]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-[#dfe7e0] mb-1">
                  Celestial Mail Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-[#78837c]" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="stargazer@tsukuyomi.guide"
                    className="w-full pl-9 pr-3 py-2 bg-[#06080d] border border-white/10 rounded-xl text-xs text-white placeholder-[#78837c] focus:outline-none focus:border-[#c9a24a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#dfe7e0] mb-1">
                  Secret Passphrase
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-[#78837c]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 bg-[#06080d] border border-white/10 rounded-xl text-xs text-white placeholder-[#78837c] focus:outline-none focus:border-[#c9a24a]"
                  />
                </div>
              </div>

              {!isLoginMode && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-[#dfe7e0] mb-1">
                      Home Sanctuary / Observing Ground
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-[#78837c]" />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        placeholder="Kyoto, JP or Mauna Kea, US"
                        maxLength={40}
                        className="w-full pl-9 pr-3 py-2 bg-[#06080d] border border-white/10 rounded-xl text-xs text-white placeholder-[#78837c] focus:outline-none focus:border-[#c9a24a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[#dfe7e0] mb-1.5">
                      Choose Samurai Crest / Celestial Avatar
                    </label>
                    <div className="flex items-center gap-2 justify-between">
                      {AVATARS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          onClick={() => setAvatar(av)}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all cursor-pointer ${
                            avatar === av
                              ? 'border-[#c9a24a] bg-[#c9a24a]/20 scale-110 shadow-md shadow-[#c9a24a]/30'
                              : 'border-white/10 bg-[#06080d] hover:border-white/30'
                          }`}
                        >
                          {av}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="flex items-center gap-2.5 pt-1 text-xs text-[#aab4ad] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={prefillDemo}
                      onChange={(e) => setPrefillDemo(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#c9a24a] cursor-pointer"
                    />
                    <span>Pre-fill starter celestial catalog (14 objects + 750 Honor)</span>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-[#e0231c] via-[#c9a24a] to-[#e0231c] text-white font-bold text-xs uppercase tracking-wider hover:opacity-95 disabled:opacity-50 shadow-lg shadow-[rgba(224,35,28,0.3)] transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Syncing with Supabase Database...'
                    : isLoginMode
                    ? 'Enter Temple'
                    : 'Seal Scroll & Begin Quest'}
                </span>
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-[#78837c]">
              {isLoginMode ? (
                <p>
                  New stargazer?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(false);
                      setError(null);
                    }}
                    className="text-[#c9a24a] hover:underline font-semibold cursor-pointer"
                  >
                    Create a Stargazer Account
                  </button>
                </p>
              ) : (
                <p>
                  Already have a scroll?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginMode(true);
                      setError(null);
                    }}
                    className="text-[#c9a24a] hover:underline font-semibold cursor-pointer"
                  >
                    Sign in to your Dojo
                  </button>
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

