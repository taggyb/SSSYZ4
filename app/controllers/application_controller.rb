class ApplicationController < ActionController::Base
  protect_from_forgery
  before_filter :send_token

  def send_token
  	gon.token = session[:access_token] if session[:access_token].present?
  end
end
