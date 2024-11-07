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

            String port = System.getenv("PORT");
            config.setHostname(host);
            config.setPort(port != null ? Integer.parseInt(port) : 8181);

            return new SocketIOServer(config);
        }
    }
