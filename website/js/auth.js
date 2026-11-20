        try {
            const stored = localStorage.getItem('JANASEVA_currentUser');
            if (!stored) return null;
            const parsed = JSON.parse(stored);
            if (this.localPreviewAllowed() || parsed.authProvider === 'mongodb' || !parsed.isLocalDemo) {
                return parsed;
            }
            return null;
