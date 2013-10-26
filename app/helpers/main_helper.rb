module MainHelper

	def signed_in
		if session[:access_token].present?
			return true
		else
			return false
		end
	end
end
