// server/services/passport-setup.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const crypto = require('crypto');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            // ✅ CORREÇÃO: Usar a URL completa para o callback
            callbackURL: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`,
            scope: ['profile', 'email'],
        },
        async (accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                let user = await User.findOne({ googleId: profile.id });

                if (user) {
                    return done(null, user);
                }

                user = await User.findOne({ email });

                if (user) {
                    user.googleId = profile.id;
                    user.fotoPerfilUrl = user.fotoPerfilUrl || profile.photos[0].value;
                    user.isEmailVerified = true;
                    await user.save();
                    return done(null, user);
                }

                const newUser = await new User({
                    googleId: profile.id,
                    nome: profile.name.givenName,
                    sobrenome: profile.name.familyName || '',
                    email: email,
                    username: `${profile.name.givenName.toLowerCase()}${crypto.randomBytes(4).toString('hex')}`,
                    fotoPerfilUrl: profile.photos[0].value,
                    isEmailVerified: true,
                    pagamentoEfetuado: true,
                }).save();

                return done(null, newUser);
            } catch (error) {
                return done(error, null);
            }
        }
    )
);