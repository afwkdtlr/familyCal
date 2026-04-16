package com.familycal.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "familycal")
public class FamilyCalProperties {

    private final Jwt jwt = new Jwt();
    private final Bootstrap bootstrap = new Bootstrap();

    public Jwt getJwt() {
        return jwt;
    }

    public Bootstrap getBootstrap() {
        return bootstrap;
    }

    public static class Jwt {
        private String secret = "change-this-secret-to-a-long-random-string-at-least-256-bits";
        private long expirationMs = 86400000L;

        public String getSecret() {
            return secret;
        }

        public void setSecret(String secret) {
            this.secret = secret;
        }

        public long getExpirationMs() {
            return expirationMs;
        }

        public void setExpirationMs(long expirationMs) {
            this.expirationMs = expirationMs;
        }
    }

    public static class Bootstrap {
        private String adminUsername = "admin";
        private String adminPassword = "ChangeMe!";

        public String getAdminUsername() {
            return adminUsername;
        }

        public void setAdminUsername(String adminUsername) {
            this.adminUsername = adminUsername;
        }

        public String getAdminPassword() {
            return adminPassword;
        }

        public void setAdminPassword(String adminPassword) {
            this.adminPassword = adminPassword;
        }
    }
}
