    package com.codebuddy;

    import com.corundumstudio.socketio.SocketIOServer;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;

    @Configuration
    public class websocketconfig {

        @Value("${socketio.host}")
        private String host;

        @Bean
        public SocketIOServer socketIOServer() throws Exception {

            com.corundumstudio.socketio.Configuration config =
                    new com.corundumstudio.socketio.Configuration();


            config.setHostname("0.0.0.0");
            String portEnv = System.getenv("PORT");
            int port = (portEnv != null) ? Integer.parseInt(portEnv) : 8080;
            config.setPort(port);

            return new SocketIOServer(config);
        }
    }
