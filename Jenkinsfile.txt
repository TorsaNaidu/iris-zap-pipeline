node('docker_aws_trivy_runner') {
    def TARGET_URL = "https://iris-beta.geminisolutions.com"
    def ZAP_PORT = "8081"
    def ZAP_REPORT = "zap_report_iris.html"
    def RECIPIENT = "torsa.naidu@gmail.com"

    try {
        stage('Login using Playwright') {
            container('docker-aws-playwright') {
                echo "🔐 Running Playwright login script to create authenticated session"
                
                // Install playwright if not installed (safe installation)
                sh """
                if ! npm list -g | grep playwright; then
                  npm install -g playwright
                fi
                """

                // Run the login script
                sh 'node playwright/login.js' 
            }
        }

        stage('Run ZAP Scan') {
            timeout(time: 15, unit: 'MINUTES') {
                container('docker-aws-zap') {
                    echo "🛡️ Running OWASP ZAP scan on ${TARGET_URL}"

                    try {
                        sh """
                        zap.sh -cmd -quickurl ${TARGET_URL} \
                        -quickout ${WORKSPACE}/${ZAP_REPORT} \
                        -quickprogress \
                        -config proxy.port=${ZAP_PORT} \
                        -config api.key=12345
                        """
                    } catch (Exception e) {
                        echo "❌ ZAP Scan failed: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        error("ZAP scan failed")
                    }
                }
            }
        }

        stage('Email ZAP Report') {
            steps {
                script {
                    if (fileExists("${WORKSPACE}/${ZAP_REPORT}")) {
                        echo "📧 Sending ZAP scan report via email."

                        try {
                            emailext(
                                subject: "ZAP Scan Report for Iris [${env.BUILD_NUMBER}]",
                                body: "Hi,<br><br>Please find the attached ZAP scan report.<br><br>Regards,<br>Jenkins",
                                to: "${RECIPIENT}",
                                attachmentsPattern: "${ZAP_REPORT}",
                                mimeType: 'text/html'
                            )
                        } catch (Exception e) {
                            echo "⚠️ Email sending failed: ${e.getMessage()}"
                            currentBuild.result = 'FAILURE'
                        }
                    } else {
                        echo "⚠️ ZAP report not found. Skipping email step."
                    }
                }
            }
        }
    } catch (Exception err) {
        echo "🚨 Pipeline failed: ${err.getMessage()}"
        currentBuild.result = 'FAILURE'
    } finally {
        echo "✅ Pipeline completed!"
    }
}
