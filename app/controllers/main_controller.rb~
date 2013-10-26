class MainController < ApplicationController
	require 'oauth2'
	enable :sessions

	client_id = '595c342ebf0f17b5d2bafdd6cb39ce9d'
	client_secret = 'a545b978b5964afd5b743911bafc0650'
	server_url = 'https://cs3213.herokuapp.com'
    redirect_url = 'http://rottencactus.herokuapp.com/'

  def client
  	client = OAuth2::Client.new(client_id, client_secret, :site => server_url)
  end

  def redirect
  	token = client.auth_code.get_token(params[:code], :redirect_uri => redirect_url)
  	session[:access_token] = token.token
  end

  def destroy
  	session[:access_token] = nil
  end
end
