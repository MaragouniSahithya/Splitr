import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Users, PieChart, Handshake } from "lucide-react";
import api from "../lib/axios";
import useAuthStore from "../store/authStore";

const Spinner = () => (
  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
);

const FieldError = ({ msg }) =>
  msg ? (
    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-xs mt-1.5 ml-1 font-medium">
      {msg}
    </motion.p>
  ) : null;

const validate = ({ name, email, password, confirmPassword }) => {
  const errors = {};
  if (!name.trim()) errors.name = "Name is required.";
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  if (!confirmPassword) {
    errors.confirmPassword = "Please confirm your password.";
  } else if (confirmPassword !== password) {
    errors.confirmPassword = "Passwords do not match.";
  }
  return errors;
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

// "Holographic" floating icon component
const HologramIcon = ({ Icon }) => (
  <motion.div
    animate={{ y: [-5, 5, -5] }}
    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
    className="relative flex items-center justify-center w-14 h-14 shrink-0"
  >
    {/* Glow backplate */}
    <div className="absolute inset-0 bg-splitr-mint/20 blur-xl rounded-full" />
    <div className="absolute inset-0 bg-gradient-to-tr from-splitr-mint/40 to-teal-400/10 rounded-xl rotate-12 blur-sm scale-110" />
    <div className="relative glass-panel bg-white/5 border border-splitr-mint/30 w-full h-full rounded-2xl flex items-center justify-center shadow-[0_0_15px_rgba(100,255,218,0.2)]">
      <Icon className="w-7 h-7 text-splitr-mint drop-shadow-[0_0_8px_rgba(100,255,218,0.8)]" />
    </div>
  </motion.div>
);

const RegisterPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const [fieldErrors, setFieldErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError("");

    const errors = validate({ name, email, password, confirmPassword });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/register", { name, email, password });
      login(data.user, data.token);
      navigate("/dashboard");
    } catch (err) {
      setServerError(err?.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getInputCls = (errField) => 
    `w-full bg-black/40 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-inner border ${
      errField 
        ? "border-red-500/50 focus:ring-red-500" 
        : "border-white/10 focus:ring-splitr-mint"
    }`;
    
  const labelCls = "block text-sm font-semibold text-slate-300 ml-1 mb-1.5";

  const features = [
    { icon: Users,     title: "Create groups",    desc: "Trips, households, events — anything" },
    { icon: PieChart,  title: "Instant balances", desc: "Always know who owes whom" },
    { icon: Handshake, title: "Settle smarter",   desc: "Minimised transactions for everyone" },
  ];

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-splitr-midnight relative overflow-x-hidden font-sans">
      {/* ── Background Abstract Elements ── */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-splitr-mint/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-teal-600/10 rounded-full blur-[150px] pointer-events-none" />

      {/* ── Left Information Panel ── */}
      <div className="lg:w-1/2 relative z-10 flex flex-col items-center justify-center p-8 lg:p-20 order-2 lg:order-1 pt-0 lg:pt-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="w-full max-w-md space-y-12"
        >
          {/* Logo / Header */}
          <motion.div variants={itemVariants} className="hidden lg:block text-center lg:text-left space-y-4">
            <h1 className="text-6xl md:text-7xl font-black tracking-tighter text-white drop-shadow-md">
              Splitr<span className="text-splitr-mint">.</span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 font-medium">
              Split expenses. <br className="hidden lg:block" /> Stay friends.
            </p>
          </motion.div>

          <div className="space-y-8">
            {features.map(({ icon, title, desc }, idx) => (
              <motion.div key={title} variants={itemVariants} className="flex items-center gap-6 group">
                <HologramIcon Icon={icon} />
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-splitr-mint transition-colors">
                    {title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="lg:w-1/2 relative z-10 flex items-center justify-center p-6 lg:p-12 order-1 lg:order-2">
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 80, delay: 0.1 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-10 pt-8">
            <h1 className="text-5xl font-black tracking-tighter text-white">
              Splitr<span className="text-splitr-mint">.</span>
            </h1>
            <p className="text-slate-400 mt-2">Split expenses. Stay friends.</p>
          </div>

          <div className="glass-panel p-8 md:p-10 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/5 relative overflow-hidden">
             {/* Subtle internal glow behind form */}
             <div className="absolute -top-32 -right-32 w-64 h-64 bg-splitr-mint/10 rounded-full blur-[80px]" />

            <h2 className="text-3xl font-bold text-white mb-2 relative z-10">Create account</h2>
            <p className="text-slate-400 text-sm mb-8 relative z-10">It&apos;s free and takes 30 seconds</p>

            <form onSubmit={handleSubmit} className="space-y-5 relative z-10" noValidate>
              
              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <label className={labelCls}>Full name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className={getInputCls(fieldErrors.name)}
                />
                <FieldError msg={fieldErrors.name} />
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <label className={labelCls}>Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={getInputCls(fieldErrors.email)}
                />
                <FieldError msg={fieldErrors.email} />
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <label className={labelCls}>Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 6 characters"
                    className={getInputCls(fieldErrors.password) + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <FieldError msg={fieldErrors.password} />
              </motion.div>

              <motion.div variants={itemVariants} initial="hidden" animate="visible">
                <label className={labelCls}>Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className={getInputCls(fieldErrors.confirmPassword) + " pr-12"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition"
                  >
                     {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <FieldError msg={fieldErrors.confirmPassword} />
              </motion.div>

              {serverError && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3 font-medium">
                  {serverError}
                </motion.div>
              )}

              <motion.button
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-splitr-mint hover:bg-[#4df0c9] text-splitr-midnight font-bold py-3.5 rounded-xl transition shadow-[0_0_20px_rgba(100,255,218,0.3)] disabled:opacity-50 disabled:shadow-none mt-2"
              >
                {loading ? <><Spinner /> Creating account…</> : "Create Account"}
              </motion.button>
            </form>

            <motion.p variants={itemVariants} initial="hidden" animate="visible" className="mt-8 text-center text-sm text-slate-400 relative z-10">
              Already have an account?{" "}
              <Link to="/login" className="text-splitr-mint font-bold hover:text-[#4df0c9] transition ml-1">
                Sign in
              </Link>
            </motion.p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RegisterPage;
