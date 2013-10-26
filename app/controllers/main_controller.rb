class MainController < ApplicationController
	require 'oauth2'

	CLIENT_ID = '595c342ebf0f17b5d2bafdd6cb39ce9d'
	CLIENT_SECRET = 'a545b978b5964afd5b743911bafc0650'
	#REDIRECT_URL = 'http://rottencactus.herokuapp.com/redirect'
  REDIRECT_URL = 'http://localhost:3000/redirect'
  #this is for testing purpose

  def client
  	OAuth2::Client.new(CLIENT_ID, CLIENT_SECRET, :site => 'https://cs3213.herokuapp.com', :authorize_url => '/oauth/new')
  end

  def authorize
  	session[:return_to] ||= request.referer
  	redirect_to client.auth_code.authorize_url(:redirect_uri => REDIRECT_URL)
  end

  def redirect
  	token = client.auth_code.get_token(params[:code], :redirect_uri => REDIRECT_URL)
  	session[:access_token] = token.token
    gon.token = session[:access_token]
    puts "access_token: " + session[:access_token]
  	redirect_to '/'
  end

  def signout
  	session.delete(:access_token)
    gon.token = nil
  	redirect_to '/'
  end

end
