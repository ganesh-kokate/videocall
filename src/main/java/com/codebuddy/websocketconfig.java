    package com.codebuddy;

    import com.corundumstudio.socketio.SocketIOServer;
    import org.springframework.beans.factory.annotation.Value;
    import org.springframework.context.annotation.Bean;
    import org.springframework.context.annotation.Configuration;

    @Configuration
    public class websocketconfig {

        @Bean
        public SocketIOServer socketIOServer() throws Exception {

            com.corundumstudio.socketio.Configuration config =
                    new com.corundumstudio.socketio.Configuration();

            config.setHostname("192.168.59.106");
            config.setPort(8000);

            return new SocketIOServer(config);
        }
    }
