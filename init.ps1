function Test-CurrentUserAdministrator {
	$prp = New-Object System.Security.Principal.WindowsPrincipal([System.Security.Principal.WindowsIdentity]::GetCurrent())
	return $prp.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
}

# if ((Test-CurrentUserAdministrator) -eq $false) {
# 	throw "Please run the script from an elevated (administrator) prompt so we can install dev cert."
# }

$dnsName = "first-party-test.localhost"
$devCert = Get-Item Cert:\CurrentUser\Root\* | Where-Object { $_.Subject -eq "CN=$dnsName" }

if ($null -eq $devCert) {
	Write-Output "$dnsName certificate not found. Creating a new one..."

	# Create new self-signed cert for this project
	$devCert = New-SelfSignedCertificate `
		-DnsName $dnsName `
		-CertStoreLocation "cert:\CurrentUser\My" `
		-FriendlyName "Test cert for COOP, COEP reporting website"

	# Export cert to use in Node.JS server
	$password = ConvertTo-SecureString -String "password" -AsPlainText -Force
	$devCert | Export-PfxCertificate -FilePath ssl.pfx -Password $password

	# Installed in root trusted store to avoid cert trust warnings in browser
	# $storeName = [System.Security.Cryptography.X509Certificates.StoreName]::Root
	# $storeLocation = [System.Security.Cryptography.X509Certificates.StoreLocation]::CurrentUser
	# $store = New-Object System.Security.Cryptography.X509Certificates.X509Store($storeName, $storeLocation)

	# Write-Host "Adding $($devCert.Subject) certificate to Root store... Look for a prompt to confirm this action" -Fore Yellow
	# $store.open("ReadWrite")
	# $store.add($devCert)
	# $store.close()
}
else {
	Write-Output "$dnsName certificate found."
}
